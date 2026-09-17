"use client";
import { useEffect, useMemo, useState } from "react";
import "./product-lines.css";
import "./catalogue.css";
import "./catalogue-v2.css";
import "./catalogue-delete.css";
import "./auth.css";
import "./crm-layout.css";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  ImagePlus,
  LayoutDashboard,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ScanText,
  Settings,
  ShipWheel,
  Target,
  Truck,
  Trash2,
  Users,
  Warehouse,
  X,
} from "lucide-react";
type ProductLine = { product: string; sku: string; quantity: number; unitPrice: number };
type CatalogueItem = { id: number; name: string; sku: string; unitPrice: number; category: string; image: string; description: string; cartonQty: string };
type ClientSpecialRate = { sku: string; rate: number };
const crmModules = ["Overview", "Clients", "Orders", "Catalogue", "Invoices", "Payments", "Shipments"] as const;
type CrmModule = typeof crmModules[number];
type WorkspaceMember = { id: number; workspace_owner_id: string; email: string; role: "admin" | "employee"; modules: CrmModule[] };
type AuditEvent = { id: number; actor_email: string; action: string; module: string; details: string; created_at: string };
type Order = {
  id: string;
  client: string;
  city: string;
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  eta: string;
  status: string;
  payment: string;
  avatar: string;
  products?: ProductLine[];
};
type Client = {
  id: number;
  name: string;
  city: string;
  contact: string;
  phone: string;
  credit: string;
  avatar: string;
  specialRates?: ClientSpecialRate[];
};
type Invoice = {
  id: string;
  client: string;
  order: string;
  amount: string;
  due: string;
  status: string;
};
const seedOrders: Order[] = [
  {
    id: "GB-24091",
    client: "Celebration Corner",
    city: "Mumbai",
    product: "Party Goggles",
    sku: "AB-981",
    quantity: 1200,
    unitPrice: 12,
    eta: "2026-09-18",
    status: "In transit",
    payment: "Partial",
    avatar: "CC",
  },
  {
    id: "GB-24090",
    client: "Happy Times Retail",
    city: "Pune",
    product: "Balloon Pump",
    sku: "AB-971",
    quantity: 450,
    unitPrice: 17,
    eta: "2026-09-22",
    status: "Confirmed",
    payment: "Paid",
    avatar: "HT",
  },
  {
    id: "GB-24089",
    client: "The Party Store",
    city: "Bengaluru",
    product: "Cake Crown",
    sku: "AB-821",
    quantity: 1100,
    unitPrice: 42,
    eta: "2026-09-12",
    status: "Customs clearance",
    payment: "Overdue",
    avatar: "PS",
  },
  {
    id: "GB-24088",
    client: "Choco & Co.",
    city: "Ahmedabad",
    product: "LED Light 10cm",
    sku: "AB-871",
    quantity: 600,
    unitPrice: 94,
    eta: "2026-09-09",
    status: "Delivered",
    payment: "Paid",
    avatar: "CO",
  },
];
const seedClients: Client[] = [
  {
    id: 1,
    name: "Celebration Corner",
    city: "Mumbai",
    contact: "Aman Shah",
    phone: "+91 98201 44120",
    credit: "₹2,00,000",
    avatar: "CC",
  },
  {
    id: 2,
    name: "Happy Times Retail",
    city: "Pune",
    contact: "Pooja Mehta",
    phone: "+91 98901 33440",
    credit: "₹1,25,000",
    avatar: "HT",
  },
  {
    id: 3,
    name: "The Party Store",
    city: "Bengaluru",
    contact: "Kiran Rao",
    phone: "+91 98450 12190",
    credit: "₹2,50,000",
    avatar: "PS",
  },
  {
    id: 4,
    name: "Choco & Co.",
    city: "Ahmedabad",
    contact: "Nisha Patel",
    phone: "+91 98983 22177",
    credit: "₹75,000",
    avatar: "CO",
  },
];
const seedInvoices: Invoice[] = [
  {
    id: "INV-1020",
    client: "Celebration Corner",
    order: "GB-24091",
    amount: "₹1,84,600",
    due: "20 Sep 2026",
    status: "Partial",
  },
  {
    id: "INV-1019",
    client: "The Party Store",
    order: "GB-24089",
    amount: "₹2,63,200",
    due: "14 Sep 2026",
    status: "Overdue",
  },
  {
    id: "INV-1018",
    client: "Happy Times Retail",
    order: "GB-24090",
    amount: "₹96,450",
    due: "25 Sep 2026",
    status: "Paid",
  },
];
const seedCatalogue: CatalogueItem[] = [
  { id: 1, name: "Party Goggles", sku: "AB-981", unitPrice: 12, category: "Party Props", image: "", description: "Party Goggles", cartonQty: "" },
  { id: 2, name: "Balloon Pump", sku: "AB-971", unitPrice: 17, category: "Balloons", image: "", description: "Balloon Pump", cartonQty: "" },
  { id: 3, name: "Cake Crown", sku: "AB-821", unitPrice: 42, category: "Cake Accessories", image: "", description: "Cake Crown", cartonQty: "" },
  { id: 4, name: "LED Light 10cm", sku: "AB-871", unitPrice: 94, category: "Decorations", image: "", description: "LED Light 10cm", cartonQty: "" },
];
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const linesFor = (order: Order): ProductLine[] => order.products || [{ product: order.product, sku: order.sku, quantity: order.quantity, unitPrice: order.unitPrice }];
const orderTotal = (order: Order) => linesFor(order).reduce((total, line) => total + line.quantity * line.unitPrice, 0);
const orderQuantity = (order: Order) => linesFor(order).reduce((total, line) => total + line.quantity, 0);
const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const readDocumentText = async (file: File) => {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (file.size > 25 * 1024 * 1024) throw new Error("This PDF is over the 25 MB catalogue limit. Please split it into smaller files.");
    let response: Response;
    if (file.size > 3 * 1024 * 1024) {
      if (!supabase) throw new Error("Cloud upload is not configured yet.");
      const path = `pdf-imports/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9._-]/gi, "-")}`;
      const { error: uploadError } = await supabase.storage.from("catalogue-imports").upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw new Error("Large PDF upload is not ready yet. Please run the latest Supabase setup script, then try again.");
      const { data, error: linkError } = await supabase.storage.from("catalogue-imports").createSignedUrl(path, 600);
      if (linkError || !data?.signedUrl) throw new Error("A secure link for this PDF could not be created.");
      response = await fetch("/api/pdf-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: data.signedUrl }) });
    } else {
      const form = new FormData();
      form.append("file", file);
      response = await fetch("/api/pdf-text", { method: "POST", body: form });
    }
    const raw = await response.text();
    let result: { text?: string; error?: string } = {};
    try { result = JSON.parse(raw); } catch { throw new Error(response.status === 413 ? "This PDF is over the online upload limit. Please use the large-file import after running the Supabase setup script." : "The PDF service returned an unexpected response. Please try again."); }
    if (!response.ok) throw new Error(result.error || "The PDF could not be read.");
    return result.text as string;
  }
  const { recognize } = await import("tesseract.js");
  return (await recognize(file, "eng")).data.text;
};
const storageKey = "geebee-crm-data-v1";
const approvedWorkspaceEmails = ["vishu108818@gmail.com"];
type SavedCrmData = { orders: Order[]; clients: Client[]; invoices: Invoice[]; catalogue: CatalogueItem[] };
const loadCrmData = (): SavedCrmData => {
  const fallback = { orders: seedOrders, clients: seedClients, invoices: seedInvoices, catalogue: seedCatalogue };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as Partial<SavedCrmData>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
      clients: Array.isArray(parsed.clients) ? parsed.clients : fallback.clients,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : fallback.invoices,
      catalogue: Array.isArray(parsed.catalogue) ? parsed.catalogue : fallback.catalogue,
    };
  } catch { return fallback; }
};
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("The image could not be saved."));
  reader.readAsDataURL(file);
});
function Pill({ value }: { value: string }) {
  return (
    <span className={`pill ${value.toLowerCase().replaceAll(" ", "-")}`}>
      {value}
    </span>
  );
}
function SignInScreen({ notice = "" }: { notice?: string }) {
  const [email, setEmail] = useState("vishu108818@gmail.com");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(notice);
  const [sending, setSending] = useState(false);
  const sendMagicLink = async () => {
    if (!supabase || !email.trim()) return;
    if (mode === "signup" && (!fullName.trim() || !phone.trim())) { setMessage("Please enter your full name and phone number."); return; }
    setSending(true); setMessage("");
    if (mode === "signup") window.localStorage.setItem("geebee-signup-profile", JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim(), phone: phone.trim() }));
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin, data: mode === "signup" ? { full_name: fullName.trim(), phone: phone.trim() } : undefined } });
    setSending(false);
    setMessage(error ? error.message : "Secure link sent. Open it from your email to continue.");
  };
  return <main className="auth-screen"><section className="auth-card"><div className="auth-logo">G</div><span className="overline">GEEBEE IMPORTS</span><h1>Private operations workspace</h1><div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} type="button" onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} type="button" onClick={() => { setMode("signup"); setMessage(""); }}>Sign up</button></div><p>{mode === "signin" ? "Enter your work email and we’ll send a secure, password-free sign-in link." : "Create your secure account details. Your administrator must still grant workspace access."}</p>{mode === "signup" && <><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" autoComplete="name"/></label><label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" autoComplete="tel"/></label></>}<label>Work email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMagicLink()} placeholder="you@company.com" autoComplete="email"/></label><button className="primary auth-submit" type="button" disabled={sending} onClick={sendMagicLink}>{sending ? "Sending secure link…" : mode === "signup" ? "Create account and send link" : "Send secure sign-in link"}</button>{message && <div className={message.toLowerCase().includes("sent") ? "auth-message" : "auth-message warning"}>{message}</div>}<small>Only users granted access by a GeeBee administrator can open the CRM.</small></section></main>;
}
export default function Home() {
  const [section, setSection] = useState("Overview"),
    [search, setSearch] = useState(""),
    [orders, setOrders] = useState(seedOrders),
    [clients, setClients] = useState(seedClients),
    [invoices, setInvoices] = useState(seedInvoices),
    [catalogue, setCatalogue] = useState(seedCatalogue),
    [storageReady, setStorageReady] = useState(false),
    [session, setSession] = useState<Session | null>(null),
    [authReady, setAuthReady] = useState(false),
    [cloudReady, setCloudReady] = useState(false),
    [cloudError, setCloudError] = useState(""),
    [accessNotice, setAccessNotice] = useState(""),
    [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(null),
    [allowedModules, setAllowedModules] = useState<CrmModule[]>([...crmModules]),
    [isAdmin, setIsAdmin] = useState(false),
    [members, setMembers] = useState<WorkspaceMember[]>([]),
    [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]),
    [clientProfile, setClientProfile] = useState<Client | null>(null),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Customers: true, "Leads & Enquiries": true, Sales: true, Products: true, Inventory: true, Operations: true, Billing: true, Imports: true, Reports: true, Automation: true, Settings: true }),
    [modal, setModal] = useState<"order" | "client" | "invoice" | "catalogue" | null>(null),
    [editing, setEditing] = useState<any>(null),
    [toast, setToast] = useState("");
  const flash = (m: string) => {
      setToast(m);
      setTimeout(() => setToast(""), 2600);
    },
    show = (k: "order" | "client" | "invoice" | "catalogue", d?: any) => {
      setEditing(d || null);
      setModal(k);
    };
  const logActivity = (action: string, module: string, details: string) => {
    const cloud = supabase;
    if (!cloud || !workspaceOwnerId || !session?.user.email) return;
    const event = { id: Date.now(), workspace_owner_id: workspaceOwnerId, actor_email: session.user.email, action, module, details, created_at: new Date().toISOString() };
    setAuditEvents((current) => [event, ...current].slice(0, 100));
    cloud.from("crm_audit_events").insert({ workspace_owner_id: event.workspace_owner_id, actor_email: event.actor_email, action, module, details }).then(({ error }) => { if (error) console.warn("Could not record activity", error.message); });
  };
  useEffect(() => {
    const saved = loadCrmData();
    setOrders(saved.orders); setClients(saved.clients); setInvoices(saved.invoices); setCatalogue(saved.catalogue);
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ orders, clients, invoices, catalogue }));
  }, [orders, clients, invoices, catalogue, storageReady]);
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const cloud = supabase;
    if (!cloud || !session?.user.email) return;
    const email = session.user.email.toLowerCase();
    const draft = typeof window !== "undefined" ? window.localStorage.getItem("geebee-signup-profile") : null;
    let profile: { fullName?: string; phone?: string } = {};
    try { profile = draft ? JSON.parse(draft) : {}; } catch { /* ignore an invalid local profile */ }
    cloud.from("crm_profiles").upsert({ user_id: session.user.id, email: session.user.email, full_name: profile.fullName || session.user.user_metadata?.full_name || "", phone: profile.phone || session.user.user_metadata?.phone || "" }, { onConflict: "user_id" }).then(() => { if (draft) window.localStorage.removeItem("geebee-signup-profile"); });
    if (approvedWorkspaceEmails.includes(email)) { setWorkspaceOwnerId(session.user.id); setAllowedModules([...crmModules]); setIsAdmin(true); return; }
    cloud.from("crm_workspace_members").select("id, workspace_owner_id, email, role, modules").ilike("email", email).maybeSingle().then(({ data }) => {
      if (!data) { setAccessNotice("Your account is awaiting access approval from a GeeBee administrator."); cloud.auth.signOut(); return; }
      const member = data as WorkspaceMember; setWorkspaceOwnerId(member.workspace_owner_id); setAllowedModules(member.modules || ["Overview"]); setIsAdmin(member.role === "admin");
    });
  }, [session]);
  useEffect(() => {
    const cloud = supabase;
    if (!cloud || !authReady || !session || !storageReady || !workspaceOwnerId) return;
    let cancelled = false;
    const loadCloudWorkspace = async () => {
      const { data: row, error } = await cloud.from("crm_workspaces").select("data").eq("owner_id", workspaceOwnerId).maybeSingle();
      if (cancelled) return;
      if (error) { setCloudError("Cloud workspace is not ready yet. Please run the supplied Supabase setup script."); return; }
      const current = { orders, clients, invoices, catalogue };
      if (row?.data) {
        const saved = row.data as Partial<SavedCrmData>;
        setOrders(Array.isArray(saved.orders) ? saved.orders : current.orders); setClients(Array.isArray(saved.clients) ? saved.clients : current.clients); setInvoices(Array.isArray(saved.invoices) ? saved.invoices : current.invoices); setCatalogue(Array.isArray(saved.catalogue) ? saved.catalogue : current.catalogue);
      } else {
        const { error: createError } = await cloud.from("crm_workspaces").upsert({ owner_id: workspaceOwnerId, data: current, updated_at: new Date().toISOString() });
        if (createError) { setCloudError("Cloud workspace is not ready yet. Please run the supplied Supabase setup script."); return; }
      }
      setCloudError(""); setCloudReady(true);
    };
    loadCloudWorkspace();
    return () => { cancelled = true; };
  }, [authReady, session, storageReady, workspaceOwnerId]);
  useEffect(() => {
    const cloud = supabase;
    if (!cloud || !session || !cloudReady || !workspaceOwnerId) return;
    const saveTimer = window.setTimeout(() => {
      cloud.from("crm_workspaces").update({ data: { orders, clients, invoices, catalogue }, updated_at: new Date().toISOString() }).eq("owner_id", workspaceOwnerId).then(({ error }) => { if (error) setCloudError("A change could not be saved to the cloud. Your local copy is still safe."); });
    }, 650);
    return () => window.clearTimeout(saveTimer);
  }, [orders, clients, invoices, catalogue, session, cloudReady, workspaceOwnerId]);
  useEffect(() => {
    const cloud = supabase;
    if (!cloud || !isAdmin || !workspaceOwnerId) return;
    cloud.from("crm_workspace_members").select("id, workspace_owner_id, email, role, modules").eq("workspace_owner_id", workspaceOwnerId).then(({ data }) => setMembers((data || []) as WorkspaceMember[]));
  }, [isAdmin, workspaceOwnerId]);
  useEffect(() => {
    const cloud = supabase;
    if (!cloud || !isAdmin || !workspaceOwnerId) return;
    cloud.from("crm_audit_events").select("id, actor_email, action, module, details, created_at").eq("workspace_owner_id", workspaceOwnerId).order("created_at", { ascending: false }).limit(100).then(({ data }) => setAuditEvents((data || []) as AuditEvent[]));
  }, [isAdmin, workspaceOwnerId]);
  const shown = useMemo(
    () =>
      orders.filter((o) =>
        `${o.id} ${o.client} ${o.product} ${o.sku}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [orders, search],
  );
  const navigationGroups = [
    { label: "Dashboard", icon: LayoutDashboard, items: [{ label: "Dashboard", section: "Overview", module: "Overview" as CrmModule }] },
    { label: "Customers", icon: Users, items: [{ label: "All Customers", section: "Clients", module: "Clients" as CrmModule, count: String(clients.length) }, { label: "New Customers", section: "New Customers", module: "Clients" as CrmModule }, { label: "Customer Groups", section: "Customer Groups", module: "Clients" as CrmModule }, { label: "Customer Activity", section: "Customer Activity", module: "Clients" as CrmModule }] },
    { label: "Leads & Enquiries", icon: Target, items: [{ label: "Leads", section: "Leads" }, { label: "Enquiries", section: "Enquiries" }, { label: "Follow-ups", section: "Follow-ups" }, { label: "Lost Leads", section: "Lost Leads" }] },
    { label: "Sales", icon: BriefcaseBusiness, items: [{ label: "Quotations", section: "Quotations" }, { label: "Orders", section: "Orders", module: "Orders" as CrmModule, count: String(orders.length) }, { label: "Backorders", section: "Backorders", module: "Orders" as CrmModule }, { label: "Returns", section: "Returns", module: "Orders" as CrmModule }] },
    { label: "Products", icon: Boxes, items: [{ label: "Products / SKUs", section: "Catalogue", module: "Catalogue" as CrmModule, count: String(catalogue.length) }, { label: "Categories", section: "Categories", module: "Catalogue" as CrmModule }, { label: "Price Lists", section: "Price Lists", module: "Catalogue" as CrmModule }, { label: "Stock", section: "Stock", module: "Catalogue" as CrmModule }] },
    { label: "Inventory", icon: Warehouse, items: [{ label: "Stock Overview", section: "Stock Overview" }, { label: "Stock Movements", section: "Stock Movements" }, { label: "Low Stock", section: "Low Stock" }, { label: "Reserved Stock", section: "Reserved Stock" }, { label: "Warehouses", section: "Warehouses" }] },
    { label: "Operations", icon: Truck, items: [{ label: "Picking", section: "Picking" }, { label: "Packing", section: "Packing" }, { label: "Dispatch", section: "Dispatch" }, { label: "Delivery", section: "Delivery" }] },
    { label: "Billing", icon: ReceiptText, items: [{ label: "Invoices", section: "Invoices", module: "Invoices" as CrmModule, count: String(invoices.filter((i) => i.status !== "Paid").length) }, { label: "Payments", section: "Payments", module: "Payments" as CrmModule, count: "2" }, { label: "Outstanding", section: "Outstanding", module: "Payments" as CrmModule }, { label: "Ageing", section: "Ageing", module: "Payments" as CrmModule }] },
    { label: "Imports", icon: ShipWheel, items: [{ label: "Suppliers", section: "Suppliers" }, { label: "Purchase Orders", section: "Purchase Orders" }, { label: "Shipments", section: "Shipments", module: "Shipments" as CrmModule }, { label: "Containers", section: "Containers", module: "Shipments" as CrmModule }, { label: "Landed Cost", section: "Landed Cost", module: "Shipments" as CrmModule }] },
    { label: "Reports", icon: ChartNoAxesCombined, items: [{ label: "Sales", section: "Sales Report" }, { label: "Customers", section: "Customer Report" }, { label: "Products", section: "Product Report" }, { label: "Inventory", section: "Inventory Report" }, { label: "Payments", section: "Payment Report" }, { label: "Sales Team", section: "Sales Team Report" }] },
    { label: "Automation", icon: Bot, items: [{ label: "Rules", section: "Rules" }, { label: "Notifications", section: "Notifications" }, { label: "Templates", section: "Templates" }] },
    { label: "Settings", icon: Settings, items: [{ label: "Users", section: "Settings" }, { label: "Roles", section: "Settings" }, { label: "GST", section: "GST" }, { label: "Warehouses", section: "Warehouses" }, { label: "WhatsApp", section: "WhatsApp" }, { label: "Integrations", section: "Integrations" }] },
  ];
  const notifications = [
    ...auditEvents.slice(0, 4).map((event) => ({ title: event.action, detail: `${event.actor_email} · ${event.module}`, time: new Date(event.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) })),
    ...invoices.filter((invoice) => invoice.status !== "Paid").slice(0, 2).map((invoice) => ({ title: `${invoice.status} invoice ${invoice.id}`, detail: `${invoice.client} · ${invoice.amount} due ${invoice.due}`, time: "Needs attention" })),
  ].slice(0, 6);
  if (!authReady) return <div className="auth-screen"><div className="auth-card"><b>Opening secure workspace…</b></div></div>;
  if (!supabase) return <div className="auth-screen"><div className="auth-card"><span className="overline">GEEBEE CRM</span><h1>Cloud connection needed</h1><p>Add the Supabase environment settings to open this private workspace.</p></div></div>;
  if (!session) return <SignInScreen notice={accessNotice} />;
  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-word">GeeBee</div>
          <small>THE PARTY FACTORY</small>
        </div>
        <div className="workspace">
          <div className="workspace-icon">G</div>
          <div>
            <b>GeeBee Imports</b>
            <span>Operations workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav>
          {navigationGroups.map((group) => {
            const permitted = group.items.filter((item) => !item.module || isAdmin || allowedModules.includes(item.module));
            if (!permitted.length) return null;
            const Icon = group.icon;
            const active = permitted.some((item) => section === item.section);
            return <div className={`nav-group ${active ? "has-active" : ""}`} key={group.label}><button className="nav-group-title" type="button" onClick={() => setExpandedGroups((current) => ({ ...current, [group.label]: !current[group.label] }))}><Icon size={16}/><span>{group.label}</span><ChevronDown size={14} className={expandedGroups[group.label] ? "open" : ""}/></button>{expandedGroups[group.label] && <div className="nav-children">{permitted.map((item) => <button key={`${group.label}-${item.label}`} className={section === item.section ? "active" : ""} type="button" onClick={() => setSection(item.section)}><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}</div>}</div>;
          })}
        </nav>
        <div className="side-bottom">
          <div className="profile">
            <div className="avatar">RM</div>
            <div>
              <b>{session.user.email}</b>
              <span>{cloudReady ? "Cloud workspace synced" : "Connecting to cloud…"}</span>
            </div>
            <button className="sign-out" type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button>
          </div>
        </div>
      </aside>
      <section className="content">
        <header>
          <div className="mobile-brand">GeeBee</div>
          <div className="search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients, orders, invoices..."
            />
          </div>
          <button className="icon-btn" type="button" aria-label="Open notifications" onClick={() => setNotificationsOpen((current) => !current)}>
            <Bell size={19} />
            {notifications.length > 0 && <i />}
          </button>
          {notificationsOpen && <section className="notification-popover"><div className="notification-head"><div><b>Notifications</b><span>Latest workspace updates</span></div><button type="button" onClick={() => setNotificationsOpen(false)}>Close</button></div>{notifications.length ? notifications.map((notification, index) => <article className="notification-item" key={`${notification.title}-${index}`}><span className="notification-dot"/><div><b>{notification.title}</b><p>{notification.detail}</p><small>{notification.time}</small></div></article>) : <p className="notification-empty">You are all caught up.</p>}</section>}
          <div className="header-avatar">RM</div>
        </header>
        {cloudError && <div className="cloud-warning">{cloudError}</div>}
        <div className="page-head">
          <div>
            <div className="eyebrow">MONDAY, 15 SEPTEMBER 2026</div>
            <h1>{section === "Overview" ? "Good morning, Rahul" : section}</h1>
            <p>
              {section === "Overview"
                ? "Here’s what’s happening with your import business."
                : `Create, update and review your ${section.toLowerCase()} records.`}
            </p>
          </div>
          {["Orders", "Clients", "Invoices", "Catalogue"].includes(section) && (
            <button
              className="primary"
              onClick={() =>
                show(
                  (section === "Catalogue" ? "catalogue" : section.slice(0, -1).toLowerCase()) as
                    "order" | "client" | "invoice" | "catalogue",
                )
              }
            >
              <Plus size={18} /> New {section === "Catalogue" ? "product" : section.slice(0, -1)}
            </button>
          )}
          {section === "Overview" && (
            <button className="primary" onClick={() => show("order")}>
              <Plus size={18} /> New order
            </button>
          )}
        </div>
        {section === "Overview" && (
          <Overview
            orders={shown}
            edit={(o) => show("order", o)}
            all={() => setSection("Orders")}
            flash={flash}
          />
        )}{" "}
        {section === "Orders" && (
          <Orders orders={shown} edit={(o) => show("order", o)} remove={(ids) => { setOrders((current) => current.filter((item) => !ids.includes(item.id))); logActivity("Removed order", "Orders", ids.join(", ")); flash(`${ids.length} order${ids.length === 1 ? "" : "s"} removed`); }} />
        )}{" "}
        {section === "Clients" && (
          <Clients
            clients={clients.filter((c) =>
              `${c.name} ${c.city} ${c.contact}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            edit={(c) => show("client", c)}
            view={(c) => setClientProfile(c)}
            remove={(ids) => { setClients((current) => current.filter((item) => !ids.includes(item.id))); logActivity("Removed client", "Clients", ids.join(", ")); flash(`${ids.length} client${ids.length === 1 ? "" : "s"} removed`); }}
          />
        )}{" "}
        {section === "Invoices" && (
          <Invoices
            invoices={invoices.filter((i) =>
              `${i.id} ${i.client} ${i.order}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            edit={(i) => show("invoice", i)}
            remove={(ids) => { setInvoices((current) => current.filter((item) => !ids.includes(item.id))); logActivity("Removed invoice", "Invoices", ids.join(", ")); flash(`${ids.length} invoice${ids.length === 1 ? "" : "s"} removed`); }}
          />
        )}{" "}
        {section === "Catalogue" && (
          <CataloguePanel
            items={catalogue.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase()))}
            edit={(item) => show("catalogue", item)}
            addDrafts={(drafts) => { setCatalogue((current) => [...current, ...drafts]); logActivity("Imported catalogue products", "Catalogue", `${drafts.length} SKU draft(s)`); flash(`${drafts.length} SKU draft${drafts.length === 1 ? "" : "s"} added from catalogue image`); }}
            remove={(ids) => { setCatalogue((current) => current.filter((item) => !ids.includes(item.id))); logActivity("Removed catalogue product", "Catalogue", ids.join(", ")); flash(`${ids.length} product${ids.length === 1 ? "" : "s"} removed from catalogue`); }}
          />
        )}{" "}
        {section === "Settings" && <TeamAccess members={members} workspaceOwnerId={workspaceOwnerId} canManage={isAdmin} onChange={setMembers} onAudit={logActivity} auditEvents={auditEvents} />}{" "}
        {!(["Overview", "Orders", "Clients", "Invoices", "Catalogue", "Settings"].includes(section)) && (
          <section className="panel coming">
            <div className="modal-mark">
              <ClipboardList size={22} />
            </div>
            <h2>{section} workspace</h2>
            <p>
              This workspace is laid out and ready for its dedicated business workflow. Orders, customers, products, invoices and team access are live now.
            </p>
          </section>
        )}
      </section>
      {modal === "order" && (
        <OrderModal
          order={editing}
          clients={clients}
          catalogue={catalogue}
          close={() => setModal(null)}
          save={(o) => {
            setOrders((x) =>
              editing ? x.map((y) => (y.id === editing.id ? o : y)) : [...x, o],
            );
            setModal(null);
            logActivity(editing ? "Updated order" : "Created order", "Orders", o.id);
            flash(
              editing
                ? "Order updated successfully"
                : "New order created successfully",
            );
          }}
        />
      )}
      {modal === "client" && (
        <ClientModal
          client={editing}
          catalogue={catalogue}
          close={() => setModal(null)}
          save={(c) => {
            setClients((x) =>
              editing ? x.map((y) => (y.id === editing.id ? c : y)) : [...x, c],
            );
            setModal(null);
            logActivity(editing ? "Updated client" : "Created client", "Clients", c.name);
            flash(
              editing
                ? "Client updated successfully"
                : "New client created successfully",
            );
          }}
        />
      )}
      {clientProfile && <ClientProfile client={clientProfile} orders={orders} invoices={invoices} catalogue={catalogue} close={() => setClientProfile(null)} edit={() => { setClientProfile(null); show("client", clientProfile); }} />}
      {modal === "invoice" && (
        <InvoiceModal
          invoice={editing}
          clients={clients}
          orders={orders}
          close={() => setModal(null)}
          save={(i) => {
            setInvoices((x) =>
              editing ? x.map((y) => (y.id === editing.id ? i : y)) : [...x, i],
            );
            setModal(null);
            logActivity(editing ? "Updated invoice" : "Created invoice", "Invoices", i.id);
            flash(
              editing
                ? "Invoice updated successfully"
                : "New invoice created successfully",
            );
          }}
        />
      )}
      {modal === "catalogue" && (
        <CatalogueModal
          item={editing}
          close={() => setModal(null)}
          save={(item) => {
            setCatalogue((current) => editing ? current.map((existing) => existing.id === editing.id ? item : existing) : [...current, item]);
            setModal(null);
            logActivity(editing ? "Updated catalogue product" : "Created catalogue product", "Catalogue", item.sku || item.name);
            flash(editing ? "Catalogue product updated" : "Catalogue product added");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <PackageCheck size={18} />
          {toast}
        </div>
      )}
    </main>
  );
}
function Overview({
  orders,
  edit,
  all,
  flash,
}: {
  orders: Order[];
  edit: (o: Order) => void;
  all: () => void;
  flash: (s: string) => void;
}) {
  return (
    <>
      <div className="metrics">
        <Metric
          label="Orders in progress"
          value="24"
          change="+4 this week"
          icon={<PackageCheck />}
          kind="burgundy"
        />
        <Metric
          label="Expected receivables"
          value="₹8.42L"
          change="₹2.16L overdue"
          icon={<CircleDollarSign />}
          kind="coral"
        />
        <Metric
          label="Shipments in transit"
          value="8"
          change="Next arrival 18 Sep"
          icon={<ShipWheel />}
          kind="gold"
        />
        <Metric
          label="Active clients"
          value="126"
          change="+9 this month"
          icon={<Users />}
          kind="violet"
        />
      </div>
      <div className="grid-main">
        <section className="panel orders-panel">
          <div className="panel-head">
            <div>
              <h2>Recent orders</h2>
              <p>Products, quantities and delivery progress.</p>
            </div>
            <button className="text-btn" onClick={all}>
              View all <span>→</span>
            </button>
          </div>
          <OrderTable orders={orders} edit={edit} compact />
        </section>
        <aside className="side-column">
          <section className="panel collection">
            <div className="panel-head">
              <div>
                <h2>Collection health</h2>
                <p>September, 2026</p>
              </div>
            </div>
            <div className="ring-row">
              <div className="ring">
                <div>
                  <b>72%</b>
                  <small>Collected</small>
                </div>
              </div>
              <div className="collection-data">
                <div>
                  <span className="dot paid" />
                  <p>
                    Collected <b>₹6.12L</b>
                  </p>
                </div>
                <div>
                  <span className="dot pending" />
                  <p>
                    Pending <b>₹2.30L</b>
                  </p>
                </div>
                <div>
                  <span className="dot late" />
                  <p>
                    Overdue <b>₹1.48L</b>
                  </p>
                </div>
              </div>
            </div>
            <button
              className="outline"
              onClick={() => flash("Opening payment follow-ups")}
            >
              Review payment follow-ups <span>→</span>
            </button>
          </section>
          <section className="panel activity">
            <div className="panel-head">
              <h2>Activity</h2>
            </div>
            {[
              [
                "Payment received",
                "Happy Times Retail cleared INV-1018",
                "₹48,225 · 12 min ago",
              ],
              [
                "Shipment updated",
                "GB-24091 departed Ningbo port",
                "45 min ago",
              ],
              [
                "Invoice due tomorrow",
                "The Party Store · ₹1,31,600 pending",
                "2 hr ago",
              ],
            ].map(([t, d, time]) => (
              <div className="activity-item" key={t}>
                <div className="activity-icon money">
                  <CircleDollarSign size={16} />
                </div>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                  <small>{time}</small>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
function Orders({
  orders,
  edit,
  remove,
}: {
  orders: Order[];
  edit: (o: Order) => void;
  remove: (ids: string[]) => void;
}) {
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Order register</h2>
          <p>Every product line can be edited at any time.</p>
        </div>
      </div>
      <OrderTable orders={orders} edit={edit} remove={remove} />
    </section>
  );
}
function OrderTable({
  orders,
  edit,
  remove,
  compact = false,
}: {
  orders: Order[];
  edit: (o: Order) => void;
  remove?: (ids: string[]) => void;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const selectable = Boolean(remove) && !compact;
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => {
    if (!remove || !selected.length || !window.confirm(`Remove ${selected.length} selected order${selected.length === 1 ? "" : "s"}?`)) return;
    remove(selected); setSelected([]);
  };
  const removeOne = (order: Order) => {
    if (!remove || !window.confirm(`Remove order ${order.id}?`)) return;
    remove([order.id]); setSelected((current) => current.filter((id) => id !== order.id));
  };
  return (
    <><div className="record-bulk-bar">{selectable ? <><span>Select orders to manage them together.</span>{selected.length > 0 && <button type="button" className="bulk-delete" onClick={removeSelected}><Trash2 size={14}/> Remove {selected.length} selected</button>}</> : null}</div><div className="table-wrap">
      <table className="records">
        <thead>
          <tr>
            {selectable && <th><input className="record-check" type="checkbox" checked={orders.length > 0 && orders.every((order) => selected.includes(order.id))} onChange={() => setSelected(selected.length === orders.length ? [] : orders.map((order) => order.id))} aria-label="Select all orders" /></th>}
            <th>ORDER</th>
            <th>CLIENT</th>
            {!compact && (
              <>
                <th>PRODUCT</th>
                <th>SKU ID</th>
                <th>QTY</th>
                <th>UNIT PRICE</th>
              </>
            )}
            <th>VALUE</th>
            <th>ETA</th>
            <th>STATUS</th>
            <th>PAYMENT</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              {selectable && <td><input className="record-check" type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} aria-label={`Select order ${o.id}`} /></td>}
              <td>
                <b>{o.id}</b>
              </td>
              <td>
                <div className="client">
                  <span className="mini-avatar">{o.avatar}</span>
                  <div>
                    <b>{o.client}</b>
                    <small>{o.city}</small>
                  </div>
                </div>
              </td>
              {!compact && (
                <>
                  <td>
                    <b>{o.product}{o.products && o.products.length > 1 ? ` +${o.products.length - 1}` : ""}</b>
                  </td>
                  <td>{o.sku}</td>
                  <td>{orderQuantity(o).toLocaleString("en-IN")}</td>
                  <td>{money(o.unitPrice)}</td>
                </>
              )}
              <td>
                <b>{money(orderTotal(o))}</b>
              </td>
              <td>
                {new Date(o.eta).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </td>
              <td>
                <Pill value={o.status} />
              </td>
              <td>
                <Pill value={o.payment} />
              </td>
              <td>
                <div className="record-actions"><button className="edit-btn" onClick={() => edit(o)} aria-label={`Edit ${o.id}`}><Pencil size={14} /></button>{selectable && <button className="row-delete" type="button" onClick={() => removeOne(o)} aria-label={`Remove ${o.id}`}><Trash2 size={14}/></button>}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <div className="empty">No matching orders found.</div>}
    </div></>
  );
}
function Clients({
  clients,
  edit,
  view,
  remove,
}: {
  clients: Client[];
  edit: (c: Client) => void;
  view: (c: Client) => void;
  remove: (ids: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => { if (selected.length && window.confirm(`Remove ${selected.length} selected client${selected.length === 1 ? "" : "s"}?`)) { remove(selected); setSelected([]); } };
  const removeOne = (client: Client) => { if (window.confirm(`Remove ${client.name} from the client directory?`)) { remove([client.id]); setSelected((current) => current.filter((id) => id !== client.id)); } };
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Client directory</h2>
          <p>Edit contacts, cities and payment thresholds.</p>
        </div>
      </div>
      <div className="record-bulk-bar"><span>Select clients to manage them together.</span>{selected.length > 0 && <button type="button" className="bulk-delete" onClick={removeSelected}><Trash2 size={14}/> Remove {selected.length} selected</button>}</div><div className="table-wrap">
        <table className="records">
          <thead>
            <tr>
              <th><input className="record-check" type="checkbox" checked={clients.length > 0 && clients.every((client) => selected.includes(client.id))} onChange={() => setSelected(selected.length === clients.length ? [] : clients.map((client) => client.id))} aria-label="Select all clients" /></th>
              <th>CLIENT</th>
              <th>LOCATION</th>
              <th>PRIMARY CONTACT</th>
              <th>PHONE</th>
              <th>PAYMENT THRESHOLD</th>
              <th>SPECIAL SKU RATES</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td><input className="record-check" type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`Select ${c.name}`} /></td>
                <td>
                  <div className="client">
                    <span className="mini-avatar">{c.avatar}</span>
                    <button className="client-name-link" type="button" onClick={() => view(c)}>{c.name}</button>
                  </div>
                </td>
                <td>{c.city}</td>
                <td>{c.contact}</td>
                <td>{c.phone}</td>
                <td>
                  <b>{c.credit}</b>
                </td>
                <td>{c.specialRates?.length ? `${c.specialRates.length} SKU rate${c.specialRates.length === 1 ? "" : "s"}` : <span className="muted-cell">Standard</span>}</td>
                <td>
                  <div className="record-actions"><button className="edit-btn" onClick={() => edit(c)} aria-label={`Edit ${c.name}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => removeOne(c)} aria-label={`Remove ${c.name}`}><Trash2 size={14}/></button></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function ClientProfile({ client, orders, invoices, catalogue, close, edit }: { client: Client; orders: Order[]; invoices: Invoice[]; catalogue: CatalogueItem[]; close: () => void; edit: () => void }) {
  const clientOrders = orders.filter((order) => order.client === client.name);
  const clientInvoices = invoices.filter((invoice) => invoice.client === client.name);
  const amount = (value: string) => Number(value.replace(/[^0-9.]/g, "")) || 0;
  const billed = clientInvoices.reduce((total, invoice) => total + amount(invoice.amount), 0);
  const paid = clientInvoices.filter((invoice) => invoice.status === "Paid").reduce((total, invoice) => total + amount(invoice.amount), 0);
  const outstanding = clientInvoices.filter((invoice) => invoice.status !== "Paid").reduce((total, invoice) => total + amount(invoice.amount), 0);
  const rateName = (sku: string) => catalogue.find((item) => item.sku === sku)?.name || "Catalogue product";
  return <Shell close={close}>
    <div className="client-profile-head"><div className="profile-avatar-large">{client.avatar || initials(client.name)}</div><div><span className="overline">CLIENT ACCOUNT</span><h2>{client.name}</h2><p>{client.city} · {client.contact}</p></div><button className="edit-profile-btn" type="button" onClick={edit}><Pencil size={14}/> Edit client</button></div>
    <div className="client-contact-grid"><div><span>Primary contact</span><b>{client.contact || "—"}</b></div><div><span>Phone</span><b>{client.phone || "—"}</b></div><div><span>Payment threshold</span><b>{client.credit || "—"}</b></div></div>
    <div className="client-stat-grid"><div><span>Total billing</span><b>{money(billed)}</b><small>{clientInvoices.length} invoice{clientInvoices.length === 1 ? "" : "s"}</small></div><div><span>Paid</span><b>{money(paid)}</b><small>{clientInvoices.filter((invoice) => invoice.status === "Paid").length} settled</small></div><div><span>Outstanding</span><b className={outstanding ? "attention" : ""}>{money(outstanding)}</b><small>{clientInvoices.filter((invoice) => invoice.status !== "Paid").length} open invoice{clientInvoices.filter((invoice) => invoice.status !== "Paid").length === 1 ? "" : "s"}</small></div><div><span>Total order value</span><b>{money(clientOrders.reduce((total, order) => total + orderTotal(order), 0))}</b><small>{clientOrders.length} order{clientOrders.length === 1 ? "" : "s"}</small></div></div>
    <section className="profile-section"><div className="profile-section-head"><h3>Special SKU rates</h3><span>{client.specialRates?.length || 0} negotiated</span></div>{client.specialRates?.length ? <div className="profile-rates">{client.specialRates.map((rate) => <article key={rate.sku}><div><b>{rate.sku}</b><span>{rateName(rate.sku)}</span></div><strong>{money(rate.rate)}</strong></article>)}</div> : <p className="profile-empty">No special rates set. Standard catalogue pricing applies.</p>}</section>
    <section className="profile-section"><div className="profile-section-head"><h3>Invoices & payment status</h3><span>{clientInvoices.length} records</span></div>{clientInvoices.length ? <div className="profile-list">{clientInvoices.map((invoice) => <article key={invoice.id}><div><b>{invoice.id}</b><span>Order {invoice.order} · Due {invoice.due}</span></div><strong>{invoice.amount}</strong><Pill value={invoice.status}/></article>)}</div> : <p className="profile-empty">No invoices have been recorded for this client.</p>}</section>
    <section className="profile-section"><div className="profile-section-head"><h3>Related orders</h3><span>{clientOrders.length} records</span></div>{clientOrders.length ? <div className="profile-list">{clientOrders.map((order) => <article key={order.id}><div><b>{order.id}</b><span>{order.product}{order.products && order.products.length > 1 ? ` +${order.products.length - 1} products` : ""} · ETA {order.eta}</span></div><strong>{money(orderTotal(order))}</strong><Pill value={order.payment}/></article>)}</div> : <p className="profile-empty">No orders have been recorded for this client.</p>}</section>
  </Shell>;
}
function TeamAccess({ members, workspaceOwnerId, canManage, onChange, onAudit, auditEvents }: { members: WorkspaceMember[]; workspaceOwnerId: string | null; canManage: boolean; onChange: (members: WorkspaceMember[]) => void; onAudit: (action: string, module: string, details: string) => void; auditEvents: AuditEvent[] }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [modules, setModules] = useState<CrmModule[]>(["Overview"]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const toggle = (module: CrmModule) => setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  const reset = () => { setEmail(""); setRole("employee"); setModules(["Overview"]); setEditingId(null); };
  const save = async () => {
    if (!supabase || !workspaceOwnerId || !email.trim()) return;
    const payload = { workspace_owner_id: workspaceOwnerId, email: email.trim().toLowerCase(), role, modules: role === "admin" ? [...crmModules] : modules };
    const { data, error } = await supabase.from("crm_workspace_members").upsert(payload, { onConflict: "workspace_owner_id,email" }).select("id, workspace_owner_id, email, role, modules").single();
    if (error) { setMessage(error.message); return; }
    onChange([...members.filter((member) => member.id !== editingId && member.email !== payload.email), data as WorkspaceMember]); onAudit(editingId ? "Updated employee access" : "Granted employee access", "Team access", `${payload.email} — ${payload.role}`); setMessage("Access saved."); reset();
  };
  const editMember = (member: WorkspaceMember) => { setEditingId(member.id); setEmail(member.email); setRole(member.role); setModules(member.modules); setMessage(""); };
  const remove = async (member: WorkspaceMember) => { if (!supabase || !window.confirm(`Remove ${member.email} from this workspace?`)) return; const { error } = await supabase.from("crm_workspace_members").delete().eq("id", member.id); if (error) { setMessage(error.message); return; } onChange(members.filter((item) => item.id !== member.id)); onAudit("Removed employee access", "Team access", member.email); };
  if (!canManage) return <section className="panel coming"><div className="modal-mark"><Settings size={22}/></div><h2>Workspace access</h2><p>Your administrator controls which modules you can use.</p></section>;
  return <section className="panel team-access"><div className="panel-head"><div><h2>Team access</h2><p>Invite employees, choose their role and give only the modules they need.</p></div></div><div className="team-grid"><div className="team-form"><b>{editingId ? "Edit employee access" : "Add employee"}</b><label>Employee email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@company.com"/></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value as "admin" | "employee")}><option value="employee">Employee</option><option value="admin">Administrator</option></select></label>{role === "employee" && <div className="module-picker"><span>Allowed modules</span>{crmModules.map((module) => <label key={module}><input type="checkbox" checked={modules.includes(module)} onChange={() => toggle(module)}/>{module}</label>)}</div>}<div className="team-buttons"><button className="primary" type="button" onClick={save}>{editingId ? "Save access" : "Grant access"}</button>{editingId && <button type="button" className="text-btn" onClick={reset}>Cancel</button>}</div>{message && <p className="team-message">{message}</p>}</div><div className="member-list"><b>Current team</b>{!members.length && <p>No employees added yet.</p>}{members.map((member) => <article className="member-card" key={member.id}><div><b>{member.email}</b><small>{member.role === "admin" ? "Administrator — all modules" : member.modules.join(", ")}</small></div><div><button type="button" onClick={() => editMember(member)}>Edit</button><button type="button" onClick={() => remove(member)}>Remove</button></div></article>)}</div></div><div className="audit-trail"><div><h3>Recent activity</h3><p>Only administrators can see this log.</p></div>{!auditEvents.length && <p className="audit-empty">Changes made after this update will appear here.</p>}{auditEvents.map((event) => <article className="audit-event" key={event.id}><div className="audit-dot"/><div><b>{event.action}</b><span>{event.actor_email} · {event.module}{event.details ? ` · ${event.details}` : ""}</span></div><time>{new Date(event.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></article>)}</div></section>;
}
function Invoices({
  invoices,
  edit,
  remove,
}: {
  invoices: Invoice[];
  edit: (i: Invoice) => void;
  remove: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => { if (selected.length && window.confirm(`Remove ${selected.length} selected invoice${selected.length === 1 ? "" : "s"}?`)) { remove(selected); setSelected([]); } };
  const removeOne = (invoice: Invoice) => { if (window.confirm(`Remove invoice ${invoice.id}?`)) { remove([invoice.id]); setSelected((current) => current.filter((id) => id !== invoice.id)); } };
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Invoice register</h2>
          <p>Keep invoice status and payment due dates current.</p>
        </div>
      </div>
      <div className="record-bulk-bar"><span>Select invoices to manage them together.</span>{selected.length > 0 && <button type="button" className="bulk-delete" onClick={removeSelected}><Trash2 size={14}/> Remove {selected.length} selected</button>}</div><div className="table-wrap">
        <table className="records">
          <thead>
            <tr>
              <th><input className="record-check" type="checkbox" checked={invoices.length > 0 && invoices.every((invoice) => selected.includes(invoice.id))} onChange={() => setSelected(selected.length === invoices.length ? [] : invoices.map((invoice) => invoice.id))} aria-label="Select all invoices" /></th>
              <th>INVOICE</th>
              <th>CLIENT</th>
              <th>ORDER</th>
              <th>AMOUNT</th>
              <th>DUE DATE</th>
              <th>STATUS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td><input className="record-check" type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} aria-label={`Select ${i.id}`} /></td>
                <td>
                  <b>{i.id}</b>
                </td>
                <td>{i.client}</td>
                <td>{i.order}</td>
                <td>
                  <b>{i.amount}</b>
                </td>
                <td>{i.due}</td>
                <td>
                  <Pill value={i.status} />
                </td>
                <td>
                  <div className="record-actions"><button className="edit-btn" onClick={() => edit(i)} aria-label={`Edit ${i.id}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => removeOne(i)} aria-label={`Remove ${i.id}`}><Trash2 size={14}/></button></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Shell({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={close}>
          <X size={19} />
        </button>
        {children}
      </form>
    </div>
  );
}
function LegacyOrderModal({
  order,
  clients,
  close,
  save,
}: {
  order: Order | null;
  clients: Client[];
  close: () => void;
  save: (o: Order) => void;
}) {
  const initial = order || {
    id: "GB-24092",
    client: "",
    city: "",
    product: "",
    sku: "",
    quantity: 0,
    unitPrice: 0,
    eta: "",
    status: "Confirmed",
    payment: "Partial",
    avatar: "",
  };
  const [f, setF] = useState(initial),
    set = (k: keyof Order, v: string | number) => setF({ ...f, [k]: v }),
    setClient = (name: string) => {
      const c = clients.find((x) => x.name === name);
      setF({
        ...f,
        client: name,
        city: c?.city || "",
        avatar: c?.avatar || initials(name),
      });
    };
  return (
    <Shell close={close}>
      <div className="modal-mark">
        <PackageCheck size={22} />
      </div>
      <h2>{order ? "Edit order" : "Create a new order"}</h2>
      <p>Product, SKU, quantity, pricing and status are all editable.</p>
      <label>
        Client
        <select
          value={f.client}
          onChange={(e) => setClient(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Product name
          <input
            value={f.product}
            onChange={(e) => set("product", e.target.value)}
            required
          />
        </label>
        <label>
          SKU ID
          <input
            value={f.sku}
            onChange={(e) => set("sku", e.target.value)}
            required
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Quantity
          <input
            type="number"
            min="1"
            value={f.quantity || ""}
            onChange={(e) => set("quantity", Number(e.target.value))}
            required
          />
        </label>
        <label>
          Unit price (₹)
          <input
            type="number"
            min="0"
            value={f.unitPrice || ""}
            onChange={(e) => set("unitPrice", Number(e.target.value))}
            required
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Expected arrival
          <input
            type="date"
            value={f.eta}
            onChange={(e) => set("eta", e.target.value)}
            required
          />
        </label>
        <label>
          Order value
          <input value={money(f.quantity * f.unitPrice)} readOnly />
        </label>
      </div>
      <div className="form-row">
        <label>
          Status
          <select
            value={f.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {[
              "Confirmed",
              "Production",
              "In transit",
              "Customs clearance",
              "Delivered",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Payment status
          <select
            value={f.payment}
            onChange={(e) => set("payment", e.target.value)}
          >
            {["Partial", "Paid", "Overdue"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="primary modal-submit"
        type="button"
        onClick={() => save(f)}
      >
        Save order
      </button>
    </Shell>
  );
}
function LegacyMultiProductOrderModal({ order, clients, close, save }: { order: Order | null; clients: Client[]; close: () => void; save: (o: Order) => void }) {
  const base = order || { id: "GB-24092", client: "", city: "", eta: "", status: "Confirmed", payment: "Partial", avatar: "" };
  const [f, setF] = useState(base);
  const [products, setProducts] = useState<ProductLine[]>(order?.products || (order ? [{ product: order.product, sku: order.sku, quantity: order.quantity, unitPrice: order.unitPrice }] : [{ product: "", sku: "", quantity: 0, unitPrice: 0 }]));
  const total = products.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const updateProduct = (index: number, key: keyof ProductLine, value: string | number) => setProducts(products.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const selectClient = (name: string) => { const client = clients.find((item) => item.name === name); setF({ ...f, client: name, city: client?.city || "", avatar: client?.avatar || initials(name) }); };
  const saveOrder = () => { const first = products[0]; save({ ...f, product: first.product, sku: first.sku, quantity: first.quantity, unitPrice: first.unitPrice, products }); };
  return <Shell close={close}><div className="modal-mark"><PackageCheck size={22} /></div><h2>{order ? "Edit order" : "Create a new order"}</h2><p>Add as many product lines as this order needs.</p><label>Client<select value={f.client} onChange={(e) => selectClient(e.target.value)} required><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id}>{client.name}</option>)}</select></label><div className="product-lines"><div className="line-heading"><b>Product lines</b><span>{products.length} item{products.length !== 1 ? "s" : ""}</span></div>{products.map((item, index) => <div className="product-line" key={index}><div className="line-number">{index + 1}</div><div className="line-fields"><input aria-label="Product name" value={item.product} onChange={(e) => updateProduct(index, "product", e.target.value)} placeholder="Product name" required /><input aria-label="SKU ID" value={item.sku} onChange={(e) => updateProduct(index, "sku", e.target.value)} placeholder="SKU ID" required /><input aria-label="Quantity" type="number" min="1" value={item.quantity || ""} onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))} placeholder="Qty" required /><input aria-label="Unit price" type="number" min="0" value={item.unitPrice || ""} onChange={(e) => updateProduct(index, "unitPrice", Number(e.target.value))} placeholder="Price ₹" required /></div><b className="line-total">{money(item.quantity * item.unitPrice)}</b>{products.length > 1 && <button type="button" className="remove-line" onClick={() => setProducts(products.filter((_, i) => i !== index))}>×</button>}</div>)}<button type="button" className="add-line" onClick={() => setProducts([...products, { product: "", sku: "", quantity: 0, unitPrice: 0 }])}><Plus size={15} /> Add another product</button></div><div className="order-total"><span>Order total</span><b>{money(total)}</b></div><div className="form-row"><label>Expected arrival<input type="date" value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} required /></label><label>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["Confirmed", "Production", "In transit", "Customs clearance", "Delivered"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label>Payment status<select value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })}>{["Partial", "Paid", "Overdue"].map((value) => <option key={value}>{value}</option>)}</select></label><button className="primary modal-submit" type="button" onClick={saveOrder}>Save order</button></Shell>;
}
function OrderModal({ order, clients, catalogue, close, save }: { order: Order | null; clients: Client[]; catalogue: CatalogueItem[]; close: () => void; save: (o: Order) => void }) {
  const base = order || { id: "GB-24092", client: "", city: "", eta: "", status: "Confirmed", payment: "Partial", avatar: "" };
  const [f, setF] = useState(base);
  const [products, setProducts] = useState<ProductLine[]>(order?.products || (order ? [{ product: order.product, sku: order.sku, quantity: order.quantity, unitPrice: order.unitPrice }] : [{ product: "", sku: "", quantity: 0, unitPrice: 0 }]));
  const [preview, setPreview] = useState("");
  const [scanState, setScanState] = useState<"idle" | "scanning" | "ready" | "error">("idle");
  const [scanNote, setScanNote] = useState("");
  const total = products.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const specialRate = (clientName: string, sku: string) => clients.find((client) => client.name === clientName)?.specialRates?.find((item) => item.sku.replaceAll("-", "").toLowerCase() === sku.replaceAll("-", "").toLowerCase())?.rate;
  const updateProduct = (index: number, key: keyof ProductLine, value: string | number) => setProducts(products.map((item, i) => {
    if (i !== index) return item;
    const updated = { ...item, [key]: value };
    const rate = key === "sku" ? specialRate(f.client, String(value)) : undefined;
    return rate === undefined ? updated : { ...updated, unitPrice: rate };
  }));
  const selectClient = (name: string) => { const client = clients.find((item) => item.name === name); setF({ ...f, client: name, city: client?.city || "", avatar: client?.avatar || initials(name) }); setProducts((current) => current.map((item) => ({ ...item, unitPrice: specialRate(name, item.sku) ?? item.unitPrice }))); };
  const scanDocument = async (file: File) => {
    setPreview((file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) ? "" : URL.createObjectURL(file)); setScanState("scanning"); setScanNote("Reading document and finding product lines…");
    try {
      const text = (await readDocumentText(file)).replace(/\s+/g, " ");
      const matchedClient = clients.find((client) => text.toLowerCase().includes(client.name.toLowerCase()));
      if (matchedClient) selectClient(matchedClient.name);
      const sku = text.match(/(?:sku|item\s*code|code)\s*[:#-]?\s*([A-Z]{1,4}[- ]?\d{2,8})/i)?.[1]?.replace(" ", "-") || "";
      const quantity = Number(text.match(/(?:qty|quantity)\s*[:x-]?\s*(\d+)/i)?.[1] || 0);
      const unitPrice = Number(text.match(/(?:unit\s*price|rate|price)\s*[:₹Rs.-]?\s*([\d,]+)/i)?.[1]?.replaceAll(",", "") || 0);
      const name = text.match(/(?:product|description|item)\s*[:#-]?\s*([A-Za-z][A-Za-z0-9 /&.-]{2,50})/i)?.[1]?.trim() || file.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]/g, " ");
      const catalogueMatch = catalogue.find((item) => item.sku.replaceAll("-", "").toLowerCase() === sku.replaceAll("-", "").toLowerCase());
      setProducts([{ product: catalogueMatch?.name || name, sku: catalogueMatch?.sku || sku, quantity, unitPrice: specialRate(matchedClient?.name || f.client, catalogueMatch?.sku || sku) ?? catalogueMatch?.unitPrice ?? unitPrice }]);
      setScanState("ready"); setScanNote(catalogueMatch ? `Matched ${catalogueMatch.sku} from your catalogue. Please confirm quantity.` : "Details were extracted. Please check the fields below before saving.");
    } catch { setScanState("error"); setScanNote("We could not read this image. You can still enter the order manually."); }
  };
  const saveOrder = () => { const first = products[0]; save({ ...f, product: first.product, sku: first.sku, quantity: first.quantity, unitPrice: first.unitPrice, products }); };
  return <Shell close={close}><div className="order-modal-head"><div className="modal-mark"><PackageCheck size={22} /></div><div><span className="overline">ORDER WORKSPACE</span><h2>{order ? "Edit order" : "Create an order"}</h2><p>Capture a document or enter product lines yourself.</p></div></div><div className="document-capture"><div className="capture-copy"><div className="capture-icon"><ScanText size={19}/></div><div><b>Smart document capture</b><p>Upload a supplier PO, invoice, product-list image, or PDF.</p></div></div><label className="upload-button"><ImagePlus size={15}/><span>{scanState === "scanning" ? "Reading document…" : "Upload image or PDF"}</span><input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && scanDocument(e.target.files[0])} disabled={scanState === "scanning"}/></label>{preview && <img className="document-preview" src={preview} alt="Uploaded document preview"/>}{scanState !== "idle" && <div className={`scan-feedback ${scanState}`}><ScanText size={15}/>{scanNote}</div>}</div><div className="modal-section-title">Order details</div><label>Client<select value={f.client} onChange={(e) => selectClient(e.target.value)} required><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id}>{client.name}</option>)}</select></label><div className="product-lines"><div className="line-heading"><b>Product lines</b><span>{products.length} item{products.length !== 1 ? "s" : ""}</span></div>{products.map((item, index) => <div className="product-line" key={index}><div className="line-number">{index + 1}</div><div className="line-fields"><input aria-label="Product name" value={item.product} onChange={(e) => updateProduct(index, "product", e.target.value)} placeholder="Product name" required /><input aria-label="SKU ID" value={item.sku} onChange={(e) => updateProduct(index, "sku", e.target.value)} placeholder="SKU ID" required /><input aria-label="Quantity" type="number" min="1" value={item.quantity || ""} onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))} placeholder="Qty" required /><input aria-label="Unit price" type="number" min="0" value={item.unitPrice || ""} onChange={(e) => updateProduct(index, "unitPrice", Number(e.target.value))} placeholder="Price ₹" required /></div><b className="line-total">{money(item.quantity * item.unitPrice)}</b>{products.length > 1 && <button type="button" className="remove-line" onClick={() => setProducts(products.filter((_, i) => i !== index))}>×</button>}</div>)}<button type="button" className="add-line" onClick={() => setProducts([...products, { product: "", sku: "", quantity: 0, unitPrice: 0 }])}><Plus size={15} /> Add product line</button></div><div className="order-total"><span>Order total</span><b>{money(total)}</b></div><div className="form-row"><label>Expected arrival<input type="date" value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} required /></label><label>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["Confirmed", "Production", "In transit", "Customs clearance", "Delivered"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label>Payment status<select value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })}>{["Partial", "Paid", "Overdue"].map((value) => <option key={value}>{value}</option>)}</select></label><button className="primary modal-submit" type="button" onClick={saveOrder}>Save order</button></Shell>;
}
function LegacyCataloguePanel({ items, edit }: { items: CatalogueItem[]; edit: (item: CatalogueItem) => void }) {
  return <section className="catalogue-page"><section className="catalogue-hero"><div><span className="overline">YOUR PRODUCT LIBRARY</span><h2>Catalogue makes order capture reliable.</h2><p>Add your product images and SKU IDs once. Uploaded order images can then match the SKU to your approved product name and price.</p></div><div className="catalogue-stat"><b>{items.length}</b><span>catalogued SKUs</span></div></section><section className="catalogue-grid">{items.map((item) => <article className="catalogue-card" key={item.id}><div className="catalogue-image">{item.image ? <img src={item.image} alt={item.name}/> : <PackageCheck size={27}/>}<span>{item.category}</span></div><div className="catalogue-info"><small>{item.sku}</small><h3>{item.name}</h3><p>{money(item.unitPrice)} / pc</p><button className="edit-product" onClick={() => edit(item)}><Pencil size={13}/> Edit product</button></div></article>)}{!items.length && <div className="empty">No catalogue products match your search.</div>}</section></section>;
}
function CataloguePanel({ items, edit, addDrafts, remove }: { items: CatalogueItem[]; edit: (item: CatalogueItem) => void; addDrafts: (drafts: CatalogueItem[]) => void; remove: (ids: number[]) => void }) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const toggleSelected = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => {
    if (!selected.length || !window.confirm(`Remove ${selected.length} selected product${selected.length === 1 ? "" : "s"} from the catalogue?`)) return;
    remove(selected); setSelected([]);
  };
  const removeOne = (item: CatalogueItem) => {
    if (!window.confirm(`Remove ${item.sku} — ${item.name} from the catalogue?`)) return;
    remove([item.id]); setSelected((current) => current.filter((id) => id !== item.id));
  };
  const importCatalogueImage = async (file?: File) => {
    if (!file) return;
    setScanState("scanning"); setNotice("Reading SKU IDs from your catalogue document…");
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        if (file.size > 25 * 1024 * 1024) throw new Error("This PDF is over the 25 MB catalogue limit. Please split it into smaller files.");
        let response: Response;
        if (file.size > 3 * 1024 * 1024) {
          if (!supabase) throw new Error("Cloud upload is not configured yet.");
          const path = `pdf-imports/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9._-]/gi, "-")}`;
          const { error: uploadError } = await supabase.storage.from("catalogue-imports").upload(path, file, { contentType: "application/pdf", upsert: false });
          if (uploadError) throw new Error("Large PDF upload is not ready yet. Please run the latest Supabase setup script, then try again.");
          const { data, error: linkError } = await supabase.storage.from("catalogue-imports").createSignedUrl(path, 600);
          if (linkError || !data?.signedUrl) throw new Error("A secure link for this PDF could not be created.");
          response = await fetch("/api/pdf-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: data.signedUrl }) });
        } else { const form = new FormData(); form.append("file", file); response = await fetch("/api/pdf-text", { method: "POST", body: form }); }
        const raw = await response.text();
        let result: { products?: Omit<CatalogueItem, "id">[]; error?: string } = {};
        try { result = JSON.parse(raw); } catch { throw new Error(response.status === 413 ? "This PDF is over the online upload limit. Please run the Supabase setup script for large-file imports." : "The PDF service returned an unexpected response. Please try again."); }
        if (!response.ok) throw new Error(result.error || "The catalogue PDF could not be read.");
        if (!result.products?.length) throw new Error("No product records were found in this catalogue PDF.");
        addDrafts(result.products.map((product: Omit<CatalogueItem, "id">, index: number) => ({ ...product, id: Date.now() + index })));
        setScanState("ready"); setNotice(`${result.products.length} products imported with descriptions, carton quantities, and prices. Add or replace product images from each card.`);
        return;
      }
      const text = await readDocumentText(file);
      const skus = [...new Set((text.toUpperCase().match(/\b[A-Z]{1,4}[- ]?\d{2,8}\b/g) || []).map((sku) => sku.replace(" ", "-")))];
      if (!skus.length) throw new Error("No SKUs found");
      const image = (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) ? "" : await fileToDataUrl(file);
      addDrafts(skus.map((sku, index) => ({ id: Date.now() + index, sku, name: `New product — ${sku}`, description: "", cartonQty: "", unitPrice: 0, category: "Uncategorised", image })));
      setScanState("ready"); setNotice(`${skus.length} SKU draft${skus.length === 1 ? "" : "s"} added. Open each card to add its product name and price.`);
    } catch (error) { setScanState("error"); setNotice(error instanceof Error ? error.message : "The catalogue file could not be read."); }
  };
  return <section className="catalogue-page"><div className="catalogue-top"><div><span className="overline">PRODUCT LIBRARY</span><h2>Your catalogue, ready for order matching.</h2><p>Upload individual product photos, or scan a complete catalogue image or PDF to create SKU drafts quickly.</p></div><div className="catalogue-count"><b>{items.length}</b><span>active SKUs</span></div></div><section className="catalogue-actions"><label className="catalogue-scan"><div className="scan-orb"><ScanText size={20}/></div><div><b>Scan catalogue image or PDF</b><p>Read SKU IDs from a complete catalogue page.</p></div><span className="scan-cta">Upload file <ImagePlus size={14}/></span><input type="file" accept="image/*,application/pdf" onChange={(e) => importCatalogueImage(e.target.files?.[0])} disabled={scanState === "scanning"}/></label><div className="catalogue-tip"><b>How it works</b><p>Catalogue SKUs are matched automatically when you scan an incoming order image or PDF.</p></div></section>{scanState !== "idle" && <div className={`catalogue-notice ${scanState}`}><ScanText size={16}/>{notice}</div>}<div className="catalogue-toolbar"><div><h3>Products</h3><span>{items.length} shown</span></div><div className="catalogue-toolbar-actions">{selected.length > 0 && <button type="button" className="bulk-delete" onClick={removeSelected}><Trash2 size={14}/> Remove {selected.length} selected</button>}<span>Click a product to edit it, or select products to remove.</span></div></div><section className="catalogue-grid">{items.map((item) => <article className="catalogue-card" key={item.id} onClick={() => edit(item)}><div className="catalogue-image">{item.image ? <img src={item.image} alt={item.name}/> : <PackageCheck size={27}/>}<span>{item.category}</span></div><div className="catalogue-info"><div className="catalogue-card-heading"><label className="catalogue-select" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Select ${item.name}`}/><span>Select</span></label><small>{item.sku}</small></div><h3>{item.name}</h3><p>{item.unitPrice ? `${money(item.unitPrice)} / pc` : "Price to be added"}</p><div className="catalogue-card-actions"><button type="button" className="edit-product"><Pencil size={13}/> Edit product</button><button type="button" className="delete-product" onClick={(event) => { event.stopPropagation(); removeOne(item); }}><Trash2 size={13}/> Remove</button></div></div></article>)}{!items.length && <div className="empty">No catalogue products match your search.</div>}</section></section>;
}
function CatalogueModal({ item, close, save }: { item: CatalogueItem | null; close: () => void; save: (item: CatalogueItem) => void }) {
  const initial = item || { id: Date.now(), name: "", sku: "", unitPrice: 0, category: "Party Props", image: "", description: "", cartonQty: "" };
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(initial.image);
  const update = (key: keyof CatalogueItem, value: string | number) => setForm({ ...form, [key]: value });
  const chooseImage = async (file?: File) => { if (!file) return; const image = await fileToDataUrl(file); setPreview(image); setForm({ ...form, image }); };
  return <Shell close={close}><div className="order-modal-head"><div className="modal-mark"><PackageCheck size={22}/></div><div><span className="overline">PRODUCT CATALOGUE</span><h2>{item ? "Edit product" : "Add a product"}</h2><p>This SKU will be used to recognise future orders.</p></div></div><label className="catalogue-upload">{preview ? <img src={preview} alt="Product preview"/> : <><ImagePlus size={23}/><b>Upload product image</b><span>PNG or JPG</span></>}<input type="file" accept="image/*" onChange={(e) => chooseImage(e.target.files?.[0])}/></label><div className="form-row"><label>Product name<input value={form.name} onChange={(e) => update("name", e.target.value)} required/></label><label>SKU ID<input value={form.sku} onChange={(e) => update("sku", e.target.value.toUpperCase())} placeholder="AB-981" required/></label></div><label>Description<textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Product details from the catalogue"/></label><div className="form-row"><label>Carton quantity<input value={form.cartonQty} onChange={(e) => update("cartonQty", e.target.value)} placeholder="e.g. 400 PCS"/></label><label>Unit price (₹)<input type="number" min="0" value={form.unitPrice || ""} onChange={(e) => update("unitPrice", Number(e.target.value))} required/></label></div><label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}>{["Balloons", "Party Props", "Cake Accessories", "Decorations", "Themed Parties", "Imported PDF"].map((value) => <option key={value}>{value}</option>)}</select></label><button className="primary modal-submit" type="button" onClick={() => save(form)}>Save to catalogue</button></Shell>;
}
function ClientModal({
  client,
  catalogue,
  close,
  save,
}: {
  client: Client | null;
  catalogue: CatalogueItem[];
  close: () => void;
  save: (c: Client) => void;
}) {
  const initial = client || {
    id: Date.now(),
    name: "",
    city: "",
    contact: "",
    phone: "",
    credit: "",
    avatar: "",
    specialRates: [],
  };
  const [f, setF] = useState<Client>({ ...initial, specialRates: initial.specialRates || [] });
  const set = (k: keyof Client, v: string) => setF({ ...f, [k]: v });
  const setRate = (sku: string, rate: number) => setF({ ...f, specialRates: [...(f.specialRates || []).filter((item) => item.sku !== sku), { sku, rate }] });
  const removeRate = (sku: string) => setF({ ...f, specialRates: (f.specialRates || []).filter((item) => item.sku !== sku) });
  return (
    <Shell close={close}>
      <div className="modal-mark">
        <Users size={22} />
      </div>
      <h2>{client ? "Edit client" : "New client"}</h2>
      <p>Set the client contact details and payment threshold.</p>
      <label>
        Business name
        <input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </label>
      <div className="form-row">
        <label>
          City
          <input
            value={f.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
        </label>
        <label>
          Payment threshold
          <input
            value={f.credit}
            onChange={(e) => set("credit", e.target.value)}
            placeholder="₹ 0"
            required
          />
        </label>
      </div>
      <label>
        Primary contact
        <input
          value={f.contact}
          onChange={(e) => set("contact", e.target.value)}
          required
        />
      </label>
      <label>
        Phone
        <input
          value={f.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </label>
      <div className="modal-section-title">Special SKU rates</div>
      <p className="special-rate-help">Set a negotiated unit price for this client. It will be applied automatically when that SKU is used in an order.</p>
      <div className="special-rate-list">{(f.specialRates || []).map((item) => <div className="special-rate-row" key={item.sku}><b>{item.sku}</b><input aria-label={`Special rate for ${item.sku}`} type="number" min="0" value={item.rate} onChange={(event) => setRate(item.sku, Number(event.target.value))}/><button type="button" onClick={() => removeRate(item.sku)}>Remove</button></div>)}</div>
      <div className="special-rate-add"><select defaultValue="" onChange={(event) => { const sku = event.target.value; if (sku && !(f.specialRates || []).some((item) => item.sku === sku)) { const product = catalogue.find((item) => item.sku === sku); setRate(sku, product?.unitPrice || 0); } event.currentTarget.value = ""; }}><option value="" disabled>Add catalogue SKU special rate</option>{catalogue.filter((item) => !(f.specialRates || []).some((rate) => rate.sku === item.sku)).map((item) => <option value={item.sku} key={item.id}>{item.sku} — {item.name}</option>)}</select></div>
      <button
        className="primary modal-submit"
        type="button"
        onClick={() => save({ ...f, avatar: f.avatar || initials(f.name) })}
      >
        Save client
      </button>
    </Shell>
  );
}
function InvoiceModal({
  invoice,
  clients,
  orders,
  close,
  save,
}: {
  invoice: Invoice | null;
  clients: Client[];
  orders: Order[];
  close: () => void;
  save: (i: Invoice) => void;
}) {
  const initial = invoice || {
    id: "INV-1021",
    client: "",
    order: "",
    amount: "",
    due: "",
    status: "Partial",
  };
  const [f, setF] = useState(initial),
    set = (k: keyof Invoice, v: string) => setF({ ...f, [k]: v });
  return (
    <Shell close={close}>
      <div className="modal-mark">
        <FileText size={22} />
      </div>
      <h2>{invoice ? "Edit invoice" : "New invoice"}</h2>
      <p>Keep invoice dates, value and payment status updated.</p>
      <label>
        Client
        <select
          value={f.client}
          onChange={(e) => set("client", e.target.value)}
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Order
          <select
            value={f.order}
            onChange={(e) => set("order", e.target.value)}
          >
            <option value="" disabled>
              Select an order
            </option>
            {orders.map((o) => (
              <option key={o.id}>{o.id}</option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input
            value={f.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="₹ 0"
            required
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Due date
          <input
            type="date"
            value={f.due.includes("-") ? f.due : ""}
            onChange={(e) => set("due", e.target.value)}
            required
          />
        </label>
        <label>
          Status
          <select
            value={f.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {["Partial", "Paid", "Overdue"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="primary modal-submit"
        type="button"
        onClick={() =>
          save({
            ...f,
            due: f.due.includes("-")
              ? new Date(f.due).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : f.due,
          })
        }
      >
        Save invoice
      </button>
    </Shell>
  );
}
function Metric({
  label,
  value,
  change,
  icon,
  kind,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  kind: string;
}) {
  return (
    <section className="metric">
      <div className={`metric-icon ${kind}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <small>{change}</small>
      </div>
    </section>
  );
}
