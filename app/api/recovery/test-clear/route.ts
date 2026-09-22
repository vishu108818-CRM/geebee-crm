import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.BACKUP_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ error: "Recovery configuration is incomplete." }, { status: 500 });
  try {
    const db = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: workspaces, error: workspaceError } = await db.from("crm_workspaces").select("owner_id, data").limit(2);
    if (workspaceError || !workspaces?.length) throw new Error("No GeeBee workspace was found.");
    if (workspaces.length !== 1) throw new Error("Recovery test requires exactly one workspace.");
    const workspace = workspaces[0];
    const { error: snapshotError } = await db.from("crm_recovery_snapshots").insert({ workspace_owner_id: workspace.owner_id, restored_by: "GitHub recovery test", source: "Recovery test clear", data: workspace.data });
    if (snapshotError) throw new Error("Recovery snapshots are not ready. Run the Supabase recovery SQL first.");
    const empty = { orders: [], clients: [], invoices: [], catalogue: [], leads: [], quotes: [], tasks: [] };
    const { error: clearError } = await db.from("crm_workspaces").update({ data: empty, updated_at: new Date().toISOString() }).eq("owner_id", workspace.owner_id);
    if (clearError) throw clearError;
    await db.from("crm_audit_events").insert({ workspace_owner_id: workspace.owner_id, actor_email: "GitHub recovery test", action: "Cleared CRM for recovery test", module: "Data recovery", details: "Protected snapshot created before test" });
    return Response.json({ ok: true, message: "CRM records cleared; recovery snapshot saved." });
  } catch (error) { console.error("Recovery test clear failed:", error instanceof Error ? error.message : error); return Response.json({ error: error instanceof Error ? error.message : "Could not clear CRM records." }, { status: 500 }); }
}
