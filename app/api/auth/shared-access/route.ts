import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const passcodeHash = "dd54ef15eb1d1f069f913335fce34cd3199f83fbeedbf9a954257965b2cd36f8";
const sharedEmail = "internal-access@geebee.local";
const sharedModules = ["Overview", "Clients", "Leads", "Orders", "Catalogue", "Invoices", "Payments", "Shipments"];

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json() as { passcode?: string };
    const receivedHash = createHash("sha256").update(String(passcode || "")).digest("hex");
    if (receivedHash !== passcodeHash) return Response.json({ error: "Incorrect shared passcode." }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return Response.json({ error: "Shared access is not configured on this deployment." }, { status: 503 });
    const db = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: existingUsers, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return Response.json({ error: usersError.message }, { status: 500 });
    let user = existingUsers.users.find((candidate) => candidate.email?.toLowerCase() === sharedEmail);
    if (!user) {
      const { data, error } = await db.auth.admin.createUser({ email: sharedEmail, email_confirm: true });
      if (error || !data.user) return Response.json({ error: error?.message || "Could not create shared access." }, { status: 500 });
      user = data.user;
    }

    const { data: workspace, error: workspaceError } = await db.from("crm_workspaces").select("owner_id").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (workspaceError || !workspace) return Response.json({ error: "The GeeBee workspace could not be found." }, { status: 500 });
    const { error: memberError } = await db.from("crm_workspace_members").upsert({ workspace_owner_id: workspace.owner_id, email: sharedEmail, role: "employee", modules: sharedModules }, { onConflict: "workspace_owner_id,email" });
    if (memberError) return Response.json({ error: memberError.message }, { status: 500 });

    const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email: sharedEmail, options: { redirectTo: new URL(request.url).origin } });
    if (linkError || !link.properties.action_link) return Response.json({ error: linkError?.message || "Could not start shared access." }, { status: 500 });
    return Response.json({ url: link.properties.action_link });
  } catch {
    return Response.json({ error: "Shared access could not be started." }, { status: 400 });
  }
}
