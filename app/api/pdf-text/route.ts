import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
    }
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items.map((item: any) => item.str || "").join(" ");
    }));
    return NextResponse.json({ text: pages.join(" "), pages: document.numPages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The PDF could not be read.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
