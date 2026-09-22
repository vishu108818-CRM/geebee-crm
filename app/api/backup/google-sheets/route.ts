import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const runtime = "nodejs";

type Workspace = { owner_id: string; data: Record<string, unknown>; updated_at: string };

const headers = {
  Customers: ["Customer ID", "Business Name", "Contact Person", "Mobile", "WhatsApp", "Email", "GSTIN", "PAN", "Business Type", "Customer Category", "State", "City", "Address", "Pincode", "Credit Limit", "Payment Terms", "Assigned Salesperson", "Customer Status", "Special Rates JSON"],
  Products: ["SKU", "Product Name", "Category", "Sub-category", "Brand", "Description", "Unit", "Pack Size", "MOQ", "Purchase Price", "Selling Price", "Wholesale Price", "Distributor Price", "GST %", "Barcode", "Weight", "Dimensions", "Supplier", "Country of Origin", "Opening Stock", "Purchase", "Orders", "Damaged", "Reserved"],
  Orders: ["Order ID", "Customer", "City", "Product", "SKU", "Quantity", "Unit Price", "ETA", "Status", "Payment Status", "Products JSON"],
  Backorders: ["Order ID", "Customer", "SKU", "Product", "Short Quantity", "Unit Price"],
  Quotes: ["Quote Number", "Customer", "Products JSON", "GST %", "Freight", "Validity", "Payment Terms", "Delivery Terms", "Status", "Created At"],
  Invoices: ["Invoice Number", "Customer", "Order", "Amount", "Due", "Status"],
  Leads: ["Lead ID", "Company", "Contact Person", "Mobile", "City", "Source", "Assigned Salesperson", "Requirement", "Expected Order Value", "Expected Order Date", "Status", "Lost Reason", "Created At"],
  Tasks: ["Task ID", "Title", "Time", "Due Date", "Assignee", "Type", "Status", "Related To"],
  "Audit Log": ["Event ID", "Workspace Owner", "Actor", "Action", "Module", "Details", "Created At"],
};

const text = (value: unknown) => value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
const rows = (items: unknown, fields: string[]) => Array.isArray(items) ? items.map((item) => fields.map((field) => text((item as Record<string, unknown>)[field]))) : [];

async function ensureSheets(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, titles: string[]) {
  const current = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(current.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) as string[]);
  const missing = titles.filter((title) => !existing.has(title));
  if (missing.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) } });
}

export async function GET(request: Request) {
  const expected = process.env.BACKUP_CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized backup request." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!url || !serviceKey || !spreadsheetId || !keyJson) return Response.json({ error: "Backup configuration is incomplete." }, { status: 500 });
  try {
    const credentials = JSON.parse(keyJson.replace(/\\n/g, "\n"));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const sheets = google.sheets({ version: "v4", auth });
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const [{ data: workspaces, error: workspaceError }, { data: auditEvents, error: auditError }] = await Promise.all([
      supabase.from("crm_workspaces").select("owner_id, data, updated_at"),
      supabase.from("crm_audit_events").select("id, workspace_owner_id, actor_email, action, module, details, created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    if (workspaceError) throw workspaceError;
    if (auditError) throw auditError;
    const workspace = ((workspaces || [])[0] as Workspace | undefined);
    if (!workspace) throw new Error("No GeeBee workspace was found.");
    const data = workspace.data || {};
    const backupRows: Record<string, string[][]> = {
      Customers: rows(data.clients, ["customerId", "name", "contact", "phone", "whatsapp", "email", "gstin", "pan", "businessType", "customerCategory", "state", "city", "address", "pincode", "credit", "paymentTerms", "assignedSalesperson", "customerStatus", "specialRates"]),
      Products: rows(data.catalogue, ["sku", "name", "category", "subCategory", "brand", "description", "unit", "packSize", "moq", "purchasePrice", "unitPrice", "wholesalePrice", "distributorPrice", "gst", "barcode", "weight", "dimensions", "supplier", "countryOfOrigin", "openingStock", "purchasedStock", "orderedStock", "damagedStock", "reservedStock"]),
      Orders: rows(data.orders, ["id", "client", "city", "product", "sku", "quantity", "unitPrice", "eta", "status", "payment", "products"]),
      Backorders: Array.isArray(data.orders) ? data.orders.flatMap((order: any) => Array.isArray(order.backorders) ? order.backorders.map((line: any) => [text(order.id), text(order.client), text(line.sku), text(line.product), text(line.quantity), text(line.unitPrice)]) : []) : [],
      Quotes: rows(data.quotes, ["id", "customer", "products", "gst", "freight", "validity", "paymentTerms", "deliveryTerms", "status", "createdAt"]),
      Invoices: rows(data.invoices, ["id", "client", "order", "amount", "due", "status"]),
      Leads: rows(data.leads, ["id", "company", "contact", "mobile", "city", "source", "salesperson", "requirement", "expectedValue", "expectedDate", "status", "lostReason", "createdAt"]),
      Tasks: rows(data.tasks, ["id", "title", "time", "dueDate", "assignee", "type", "status", "relatedTo"]),
      "Audit Log": (auditEvents || []).map((event: any) => [text(event.id), text(event.workspace_owner_id), text(event.actor_email), text(event.action), text(event.module), text(event.details), text(event.created_at)]),
    };
    const titles = ["README", "Backup Log", ...Object.keys(headers)];
    await ensureSheets(sheets, spreadsheetId, titles);
    for (const [title, header] of Object.entries(headers)) {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${title}'!A:ZZ` });
      await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${title}'!A1`, valueInputOption: "RAW", requestBody: { values: [header, ...backupRows[title]] } });
    }
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "'README'!A:Z" });
    await sheets.spreadsheets.values.update({ spreadsheetId, range: "'README'!A1", valueInputOption: "RAW", requestBody: { values: [["GeeBee CRM Recovery Backup"], ["Do not rename column headers. Restore imports validate these tabs and columns."], ["Latest backup", new Date().toISOString()], ["Workspace updated at", workspace.updated_at]] } });
    const countSummary = Object.entries(backupRows).map(([title, value]) => `${title}: ${value.length}`).join(" | ");
    await sheets.spreadsheets.values.append({ spreadsheetId, range: "'Backup Log'!A:D", valueInputOption: "RAW", requestBody: { values: [[new Date().toISOString(), "Success", workspace.updated_at, countSummary]] } });
    return Response.json({ ok: true, backupAt: new Date().toISOString(), records: countSummary });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Google Sheets backup failed." }, { status: 500 });
  }
}
