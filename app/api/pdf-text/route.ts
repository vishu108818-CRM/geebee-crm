import { NextResponse } from "next/server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

export const runtime = "nodejs";

type ParsedProduct = { sku: string; name: string; description: string; cartonQty: string; unitPrice: number; category: string; image: string; y: number; column: "left" | "right" };

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
    }
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href;
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      const items = content.items.filter((item: any) => item.str?.trim()).map((item: any) => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }));
      // In this catalogue the right-column labels begin slightly left of the page midpoint.
      const split = page.view[2] * 0.42;
      const parseColumn = (column: typeof items, side: "left" | "right") => {
        const raw = column.map((item) => item.text).join(" ");
        const skuItems = column.filter((item) => /^AB\s*\d{2,8}$/i.test(item.text));
        return [...raw.matchAll(/\b(AB\s*\d{2,8})\b([\s\S]*?)(?=\bAB\s*\d{2,8}\b|$)/gi)].map((match, itemIndex) => {
          const details = match[2];
          const description = details.match(/Description-\s*([\s\S]*?)(?=Carton Qty-|Inner Qty-|PRICE-|$)/i)?.[1]?.replace(/Sizes-\s*/gi, " ").trim() || "";
          const cartonQty = details.match(/Carton Qty-\s*([^]*?)(?=Inner Qty-|PRICE-|$)/i)?.[1]?.trim() || "";
          const priceText = details.match(/PRICE-\s*([\d,.]+)/i)?.[1]?.replaceAll(",", "") || "0";
          return { sku: match[1].replace(/\s+/g, "-"), name: description || `Product ${match[1]}`, description, cartonQty, unitPrice: Number(priceText) || 0, category: "Imported PDF", image: "", y: skuItems[itemIndex]?.y || 0, column: side } satisfies ParsedProduct;
        });
      };
      const products = [...parseColumn(items.filter((item) => item.x < split), "left"), ...parseColumn(items.filter((item) => item.x >= split), "right")];
      const viewport = page.getViewport({ scale: 1 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas: canvas as any, canvasContext: canvas.getContext("2d") as any, viewport }).promise;
      const output = join(process.cwd(), "public", "catalogue-imports"); await mkdir(output, { recursive: true });
      for (const [productIndex, product] of products.entries()) {
        const next = products.filter((candidate) => candidate.column === product.column && candidate.y < product.y).sort((a, b) => b.y - a.y)[0];
        const rowTop = viewport.height - product.y;
        const cropTop = Math.min(Math.max(rowTop + 68, 0), viewport.height - 1);
        const nextTop = next ? viewport.height - next.y : viewport.height - 12;
        const cropHeight = Math.max(70, Math.min(nextTop - cropTop - 8, 230));
        const cropWidth = Math.floor(viewport.width / 2) - 12;
        const cropX = product.column === "left" ? 6 : Math.floor(viewport.width / 2) + 6;
        const crop = createCanvas(cropWidth, cropHeight); crop.getContext("2d").drawImage(canvas, cropX, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const fileName = `catalogue-${Date.now()}-${index + 1}-${productIndex}.png`;
        await writeFile(join(output, fileName), crop.toBuffer("image/png")); product.image = `/catalogue-imports/${fileName}`;
      }
      return { text: items.map((item) => item.text).join(" "), products };
    }));
    const products = pages.flatMap((page) => page.products.map(({ y, column, ...product }) => product));
    return NextResponse.json({ text: pages.map((page) => page.text).join(" "), products, pages: document.numPages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The PDF could not be read.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
