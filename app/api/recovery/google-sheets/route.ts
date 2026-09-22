import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const runtime = "nodejs";

const sheetTabs = ["Customers", "Products", "Orders", "Backorders", "Quotes", "Invoices", "Leads", "Tasks"] as const;
type Tab = typeof sheetTabs[number];
type Row = Record<string, string>;

const number = (value: string | undefined) => Number(String(value || "").replaceAll(",", "")) || 0;
const json = <T>(value: string | undefined, fallback: T): T => { try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } };
const initials = (value: string) => value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function credentials() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!key) throw new Error("Google Sheets backup is not configured.");
  const parsed = JSON.parse(key);
  if (typeof parsed.private_key === "string") parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

async function context(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !serviceKey || !token) throw new Error("Sign in again before starting a recovery.");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Your session could not be verified.");
  const user = userData.user;
  const email = user.email;
  if (!email) throw new Error("Your session could not be verified.");
  const { data: owned } = await db.from("crm_workspaces").select("owner_id").eq("owner_id", user.id).maybeSingle();
  if (owned) return { db, ownerId: user.id, email };
  const { data: member } = await db.from("crm_workspace_members").select("workspace_owner_id, role").ilike("email", email).eq("role", "admin").maybeSingle();
  if (!member) throw new Error("Only a GeeBee administrator can restore data.");
  return { db, ownerId: member.workspace_owner_id as string, email };
}

async function readBackup() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("Google Sheet ID is not configured.");
  const auth = new google.auth.GoogleAuth({ credentials: credentials(), scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const sheets = google.sheets({ version: "v4", auth });
  const result = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges: sheetTabs.map((tab) => `'${tab}'!A:ZZ`) });
  const values = result.data.valueRanges || [];
  const rows = {} as Record<Tab, Row[]>;
  const counts = {} as Record<Tab, number>;
  const headers = {} as Record<Tab, string[]>;
  sheetTabs.forEach((tab, index) => {
    const data = values[index]?.values || [];
    const header = (data[0] || []).map(String);
    if (!header.length) throw new Error(`The ${tab} tab is missing or empty. Use a GeeBee backup sheet.`);
    headers[tab] = header;
    rows[tab] = data.slice(1).filter((line) => line.some((value: unknown) => String(value).trim())).map((line) => Object.fromEntries(header.map((name, column) => [name, String(line[column] ?? "")]))) as Row[];
    counts[tab] = rows[tab].length;
  });
  if (!headers.Customers.includes("Business Name") || !headers.Products.includes("SKU") || !headers.Orders.includes("Order ID")) throw new Error("This is not a valid GeeBee recovery backup. Do not rename backup headers.");
  return { rows, counts };
}

function restoreData(rows: Record<Tab, Row[]>) {
  const clients = rows.Customers.map((row, index) => ({ id: number(row["Record ID"]) || Date.now() + index, customerId: row["Customer ID"], name: row["Business Name"], contact: row["Contact Person"], phone: row.Mobile, whatsapp: row.WhatsApp, email: row.Email, gstin: row.GSTIN, pan: row.PAN, businessType: row["Business Type"], customerCategory: row["Customer Category"], state: row.State, city: row.City, address: row.Address, pincode: row.Pincode, credit: row["Credit Limit"], paymentTerms: row["Payment Terms"], assignedSalesperson: row["Assigned Salesperson"], customerStatus: row["Customer Status"], specialRates: json(row["Special Rates JSON"], []), avatar: initials(row["Business Name"] || "Customer") }));
  const catalogue = rows.Products.map((row, index) => ({ id: number(row["Record ID"]) || Date.now() + 1000 + index, sku: row.SKU, name: row["Product Name"], category: row.Category, subCategory: row["Sub-category"], brand: row.Brand, description: row.Description, cartonQty: row["Carton Qty"] || "", image: "", unit: row.Unit, packSize: row["Pack Size"], moq: number(row.MOQ), purchasePrice: number(row["Purchase Price"]), unitPrice: number(row["Selling Price"]), wholesalePrice: number(row["Wholesale Price"]), distributorPrice: number(row["Distributor Price"]), gst: number(row["GST %"]), barcode: row.Barcode, weight: row.Weight, dimensions: row.Dimensions, supplier: row.Supplier, countryOfOrigin: row["Country of Origin"], openingStock: number(row["Opening Stock"]), purchasedStock: number(row.Purchase), orderedStock: number(row.Orders), damagedStock: number(row.Damaged), reservedStock: number(row.Reserved) }));
  const backorders = new Map<string, unknown[]>();
  rows.Backorders.forEach((row) => { const orderId = row["Order ID"]; if (!orderId) return; backorders.set(orderId, [...(backorders.get(orderId) || []), { sku: row.SKU, product: row.Product, quantity: number(row["Short Quantity"]), unitPrice: number(row["Unit Price"]) }]); });
  const orders = rows.Orders.map((row) => { const products = json(row["Products JSON"], [] as unknown[]); const client = row.Customer || "Customer"; return { id: row["Order ID"], client: row.Customer, city: row.City, product: row.Product, sku: row.SKU, quantity: number(row.Quantity), unitPrice: number(row["Unit Price"]), eta: row.ETA, status: row.Status, payment: row["Payment Status"], products, backorders: backorders.get(row["Order ID"]), avatar: initials(client) }; });
  const quotes = rows.Quotes.map((row) => ({ id: row["Quote Number"], customer: row.Customer, products: json(row["Products JSON"], []), gst: number(row["GST %"]), freight: number(row.Freight), validity: row.Validity, paymentTerms: row["Payment Terms"], deliveryTerms: row["Delivery Terms"], status: row.Status || "Draft", createdAt: row["Created At"] }));
  const invoices = rows.Invoices.map((row) => ({ id: row["Invoice Number"], client: row.Customer, order: row.Order, amount: row.Amount, due: row.Due, status: row.Status }));
  const leads = rows.Leads.map((row) => ({ id: row["Lead ID"], company: row.Company, contact: row["Contact Person"], mobile: row.Mobile, city: row.City, source: row.Source, salesperson: row["Assigned Salesperson"], requirement: row.Requirement, expectedValue: row["Expected Order Value"], expectedDate: row["Expected Order Date"], status: row.Status || "New", lostReason: row["Lost Reason"], createdAt: row["Created At"] }));
  const tasks = rows.Tasks.map((row) => ({ id: row["Task ID"], title: row.Title, time: row.Time, dueDate: row["Due Date"], assignee: row.Assignee, type: row.Type || "Other", status: row.Status || "Open", relatedTo: row["Related To"] }));
  return { clients, catalogue, orders, quotes, invoices, leads, tasks };
}

export async function GET(request: Request) {
  try { await context(request); const backup = await readBackup(); return Response.json({ ok: true, counts: backup.counts }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not read the recovery backup." }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const { confirm } = await request.json();
    if (confirm !== "RESTORE GEEBEE") return Response.json({ error: "Type RESTORE GEEBEE exactly to approve this recovery." }, { status: 400 });
    const { db, ownerId, email } = await context(request);
    const backup = await readBackup();
    const restored = restoreData(backup.rows);
    const { data: current, error: currentError } = await db.from("crm_workspaces").select("data").eq("owner_id", ownerId).single();
    if (currentError || !current) throw new Error("The live workspace could not be protected before recovery.");
    const { error: snapshotError } = await db.from("crm_recovery_snapshots").insert({ workspace_owner_id: ownerId, restored_by: email, data: current.data });
    if (snapshotError) throw new Error("Recovery snapshot storage is not ready. Run the latest Supabase schema before restoring.");
    const { error: updateError } = await db.from("crm_workspaces").update({ data: restored, updated_at: new Date().toISOString() }).eq("owner_id", ownerId);
    if (updateError) throw updateError;
    await db.from("crm_audit_events").insert({ workspace_owner_id: ownerId, actor_email: email, action: "Restored Google Sheets backup", module: "Data recovery", details: Object.entries(backup.counts).map(([tab, count]) => `${tab}: ${count}`).join(" | ") });
    return Response.json({ ok: true, data: restored, counts: backup.counts });
  } catch (error) { console.error("Google Sheets recovery failed:", error instanceof Error ? error.message : error); return Response.json({ error: error instanceof Error ? error.message : "Could not restore the CRM." }, { status: 400 }); }
}
