"use client";
import { useMemo, useState } from "react";
import "./product-lines.css";
import "./catalogue.css";
import "./catalogue-v2.css";
import {
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  FileText,
  ImagePlus,
  LayoutDashboard,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ScanText,
  Settings,
  ShipWheel,
  Users,
  X,
} from "lucide-react";
type ProductLine = { product: string; sku: string; quantity: number; unitPrice: number };
type CatalogueItem = { id: number; name: string; sku: string; unitPrice: number; category: string; image: string };
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
  { id: 1, name: "Party Goggles", sku: "AB-981", unitPrice: 12, category: "Party Props", image: "" },
  { id: 2, name: "Balloon Pump", sku: "AB-971", unitPrice: 17, category: "Balloons", image: "" },
  { id: 3, name: "Cake Crown", sku: "AB-821", unitPrice: 42, category: "Cake Accessories", image: "" },
  { id: 4, name: "LED Light 10cm", sku: "AB-871", unitPrice: 94, category: "Decorations", image: "" },
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
function Pill({ value }: { value: string }) {
  return (
    <span className={`pill ${value.toLowerCase().replaceAll(" ", "-")}`}>
      {value}
    </span>
  );
}
export default function Home() {
  const [section, setSection] = useState("Overview"),
    [search, setSearch] = useState(""),
    [orders, setOrders] = useState(seedOrders),
    [clients, setClients] = useState(seedClients),
    [invoices, setInvoices] = useState(seedInvoices),
    [catalogue, setCatalogue] = useState(seedCatalogue),
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
  const shown = useMemo(
    () =>
      orders.filter((o) =>
        `${o.id} ${o.client} ${o.product} ${o.sku}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [orders, search],
  );
  const nav = [
    [LayoutDashboard, "Overview"],
    [Users, "Clients", String(clients.length)],
    [Boxes, "Orders", String(orders.length)],
    [PackageCheck, "Catalogue", String(catalogue.length)],
    [
      FileText,
      "Invoices",
      String(invoices.filter((i) => i.status !== "Paid").length),
    ],
    [CircleDollarSign, "Payments", "2"],
    [ShipWheel, "Shipments"],
  ] as const;
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
          {nav.map(([Icon, label, count]) => (
            <button
              key={label}
              className={section === label ? "active" : ""}
              onClick={() => setSection(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count && <em>{count}</em>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <button onClick={() => setSection("Settings")}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <div className="avatar">RM</div>
            <div>
              <b>Rahul Maggu</b>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={18} />
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
          <button className="icon-btn">
            <Bell size={19} />
            <i />
          </button>
          <div className="header-avatar">RM</div>
        </header>
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
          <Orders orders={shown} edit={(o) => show("order", o)} />
        )}{" "}
        {section === "Clients" && (
          <Clients
            clients={clients.filter((c) =>
              `${c.name} ${c.city} ${c.contact}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            edit={(c) => show("client", c)}
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
          />
        )}{" "}
        {section === "Catalogue" && (
          <CataloguePanel
            items={catalogue.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase()))}
            edit={(item) => show("catalogue", item)}
            addDrafts={(drafts) => { setCatalogue((current) => [...current, ...drafts]); flash(`${drafts.length} SKU draft${drafts.length === 1 ? "" : "s"} added from catalogue image`); }}
          />
        )}{" "}
        {["Payments", "Shipments", "Settings"].includes(section) && (
          <section className="panel coming">
            <div className="modal-mark">
              <Settings size={22} />
            </div>
            <h2>{section} workspace</h2>
            <p>
              This module is ready for the next build. Orders, clients and
              invoices are editable now.
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
          close={() => setModal(null)}
          save={(c) => {
            setClients((x) =>
              editing ? x.map((y) => (y.id === editing.id ? c : y)) : [...x, c],
            );
            setModal(null);
            flash(
              editing
                ? "Client updated successfully"
                : "New client created successfully",
            );
          }}
        />
      )}
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
}: {
  orders: Order[];
  edit: (o: Order) => void;
}) {
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Order register</h2>
          <p>Every product line can be edited at any time.</p>
        </div>
      </div>
      <OrderTable orders={orders} edit={edit} />
    </section>
  );
}
function OrderTable({
  orders,
  edit,
  compact = false,
}: {
  orders: Order[];
  edit: (o: Order) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="records">
        <thead>
          <tr>
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
                <button className="edit-btn" onClick={() => edit(o)}>
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <div className="empty">No matching orders found.</div>}
    </div>
  );
}
function Clients({
  clients,
  edit,
}: {
  clients: Client[];
  edit: (c: Client) => void;
}) {
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Client directory</h2>
          <p>Edit contacts, cities and payment thresholds.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="records">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>LOCATION</th>
              <th>PRIMARY CONTACT</th>
              <th>PHONE</th>
              <th>PAYMENT THRESHOLD</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="client">
                    <span className="mini-avatar">{c.avatar}</span>
                    <b>{c.name}</b>
                  </div>
                </td>
                <td>{c.city}</td>
                <td>{c.contact}</td>
                <td>{c.phone}</td>
                <td>
                  <b>{c.credit}</b>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => edit(c)}>
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Invoices({
  invoices,
  edit,
}: {
  invoices: Invoice[];
  edit: (i: Invoice) => void;
}) {
  return (
    <section className="panel record-panel">
      <div className="panel-head">
        <div>
          <h2>Invoice register</h2>
          <p>Keep invoice status and payment due dates current.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="records">
          <thead>
            <tr>
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
                  <button className="edit-btn" onClick={() => edit(i)}>
                    <Pencil size={14} />
                  </button>
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
  const updateProduct = (index: number, key: keyof ProductLine, value: string | number) => setProducts(products.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const selectClient = (name: string) => { const client = clients.find((item) => item.name === name); setF({ ...f, client: name, city: client?.city || "", avatar: client?.avatar || initials(name) }); };
  const scanDocument = async (file: File) => {
    setPreview(URL.createObjectURL(file)); setScanState("scanning"); setScanNote("Reading document and finding product lines…");
    try {
      const { recognize } = await import("tesseract.js");
      const result = await recognize(file, "eng");
      const text = result.data.text.replace(/\s+/g, " ");
      const matchedClient = clients.find((client) => text.toLowerCase().includes(client.name.toLowerCase()));
      if (matchedClient) selectClient(matchedClient.name);
      const sku = text.match(/(?:sku|item\s*code|code)\s*[:#-]?\s*([A-Z]{1,4}[- ]?\d{2,8})/i)?.[1]?.replace(" ", "-") || "";
      const quantity = Number(text.match(/(?:qty|quantity)\s*[:x-]?\s*(\d+)/i)?.[1] || 0);
      const unitPrice = Number(text.match(/(?:unit\s*price|rate|price)\s*[:₹Rs.-]?\s*([\d,]+)/i)?.[1]?.replaceAll(",", "") || 0);
      const name = text.match(/(?:product|description|item)\s*[:#-]?\s*([A-Za-z][A-Za-z0-9 /&.-]{2,50})/i)?.[1]?.trim() || file.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]/g, " ");
      const catalogueMatch = catalogue.find((item) => item.sku.replaceAll("-", "").toLowerCase() === sku.replaceAll("-", "").toLowerCase());
      setProducts([{ product: catalogueMatch?.name || name, sku: catalogueMatch?.sku || sku, quantity, unitPrice: catalogueMatch?.unitPrice || unitPrice }]);
      setScanState("ready"); setScanNote(catalogueMatch ? `Matched ${catalogueMatch.sku} from your catalogue. Please confirm quantity.` : "Details were extracted. Please check the fields below before saving.");
    } catch { setScanState("error"); setScanNote("We could not read this image. You can still enter the order manually."); }
  };
  const saveOrder = () => { const first = products[0]; save({ ...f, product: first.product, sku: first.sku, quantity: first.quantity, unitPrice: first.unitPrice, products }); };
  return <Shell close={close}><div className="order-modal-head"><div className="modal-mark"><PackageCheck size={22} /></div><div><span className="overline">ORDER WORKSPACE</span><h2>{order ? "Edit order" : "Create an order"}</h2><p>Capture a document or enter product lines yourself.</p></div></div><div className="document-capture"><div className="capture-copy"><div className="capture-icon"><ScanText size={19}/></div><div><b>Smart document capture</b><p>Upload a supplier PO, invoice or product-list image.</p></div></div><label className="upload-button"><ImagePlus size={15}/><span>{scanState === "scanning" ? "Reading image…" : "Upload image"}</span><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && scanDocument(e.target.files[0])} disabled={scanState === "scanning"}/></label>{preview && <img className="document-preview" src={preview} alt="Uploaded document preview"/>}{scanState !== "idle" && <div className={`scan-feedback ${scanState}`}><ScanText size={15}/>{scanNote}</div>}</div><div className="modal-section-title">Order details</div><label>Client<select value={f.client} onChange={(e) => selectClient(e.target.value)} required><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id}>{client.name}</option>)}</select></label><div className="product-lines"><div className="line-heading"><b>Product lines</b><span>{products.length} item{products.length !== 1 ? "s" : ""}</span></div>{products.map((item, index) => <div className="product-line" key={index}><div className="line-number">{index + 1}</div><div className="line-fields"><input aria-label="Product name" value={item.product} onChange={(e) => updateProduct(index, "product", e.target.value)} placeholder="Product name" required /><input aria-label="SKU ID" value={item.sku} onChange={(e) => updateProduct(index, "sku", e.target.value)} placeholder="SKU ID" required /><input aria-label="Quantity" type="number" min="1" value={item.quantity || ""} onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))} placeholder="Qty" required /><input aria-label="Unit price" type="number" min="0" value={item.unitPrice || ""} onChange={(e) => updateProduct(index, "unitPrice", Number(e.target.value))} placeholder="Price ₹" required /></div><b className="line-total">{money(item.quantity * item.unitPrice)}</b>{products.length > 1 && <button type="button" className="remove-line" onClick={() => setProducts(products.filter((_, i) => i !== index))}>×</button>}</div>)}<button type="button" className="add-line" onClick={() => setProducts([...products, { product: "", sku: "", quantity: 0, unitPrice: 0 }])}><Plus size={15} /> Add product line</button></div><div className="order-total"><span>Order total</span><b>{money(total)}</b></div><div className="form-row"><label>Expected arrival<input type="date" value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} required /></label><label>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["Confirmed", "Production", "In transit", "Customs clearance", "Delivered"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label>Payment status<select value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })}>{["Partial", "Paid", "Overdue"].map((value) => <option key={value}>{value}</option>)}</select></label><button className="primary modal-submit" type="button" onClick={saveOrder}>Save order</button></Shell>;
}
function LegacyCataloguePanel({ items, edit }: { items: CatalogueItem[]; edit: (item: CatalogueItem) => void }) {
  return <section className="catalogue-page"><section className="catalogue-hero"><div><span className="overline">YOUR PRODUCT LIBRARY</span><h2>Catalogue makes order capture reliable.</h2><p>Add your product images and SKU IDs once. Uploaded order images can then match the SKU to your approved product name and price.</p></div><div className="catalogue-stat"><b>{items.length}</b><span>catalogued SKUs</span></div></section><section className="catalogue-grid">{items.map((item) => <article className="catalogue-card" key={item.id}><div className="catalogue-image">{item.image ? <img src={item.image} alt={item.name}/> : <PackageCheck size={27}/>}<span>{item.category}</span></div><div className="catalogue-info"><small>{item.sku}</small><h3>{item.name}</h3><p>{money(item.unitPrice)} / pc</p><button className="edit-product" onClick={() => edit(item)}><Pencil size={13}/> Edit product</button></div></article>)}{!items.length && <div className="empty">No catalogue products match your search.</div>}</section></section>;
}
function CataloguePanel({ items, edit, addDrafts }: { items: CatalogueItem[]; edit: (item: CatalogueItem) => void; addDrafts: (drafts: CatalogueItem[]) => void }) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");
  const importCatalogueImage = async (file?: File) => {
    if (!file) return;
    setScanState("scanning"); setNotice("Reading SKU IDs from your catalogue image…");
    try {
      const { recognize } = await import("tesseract.js");
      const result = await recognize(file, "eng");
      const skus = [...new Set((result.data.text.toUpperCase().match(/\b[A-Z]{1,4}[- ]?\d{2,8}\b/g) || []).map((sku) => sku.replace(" ", "-")))];
      if (!skus.length) throw new Error("No SKUs found");
      const image = URL.createObjectURL(file);
      addDrafts(skus.map((sku, index) => ({ id: Date.now() + index, sku, name: `New product — ${sku}`, unitPrice: 0, category: "Uncategorised", image })));
      setScanState("ready"); setNotice(`${skus.length} SKU draft${skus.length === 1 ? "" : "s"} added. Open each card to add its product name and price.`);
    } catch { setScanState("error"); setNotice("No SKU IDs were found. Please use a sharp, readable catalogue image and try again."); }
  };
  return <section className="catalogue-page"><div className="catalogue-top"><div><span className="overline">PRODUCT LIBRARY</span><h2>Your catalogue, ready for order matching.</h2><p>Upload individual product photos, or scan an entire catalogue image to create SKU drafts quickly.</p></div><div className="catalogue-count"><b>{items.length}</b><span>active SKUs</span></div></div><section className="catalogue-actions"><label className="catalogue-scan"><div className="scan-orb"><ScanText size={20}/></div><div><b>Scan catalogue image</b><p>Read SKU IDs from one complete catalogue page.</p></div><span className="scan-cta">Upload image <ImagePlus size={14}/></span><input type="file" accept="image/*" onChange={(e) => importCatalogueImage(e.target.files?.[0])} disabled={scanState === "scanning"}/></label><div className="catalogue-tip"><b>How it works</b><p>Catalogue SKUs are matched automatically when you scan an incoming order image.</p></div></section>{scanState !== "idle" && <div className={`catalogue-notice ${scanState}`}><ScanText size={16}/>{notice}</div>}<div className="catalogue-toolbar"><div><h3>Products</h3><span>{items.length} shown</span></div><span>Click a product to edit its image, SKU, and price.</span></div><section className="catalogue-grid">{items.map((item) => <article className="catalogue-card" key={item.id} onClick={() => edit(item)}><div className="catalogue-image">{item.image ? <img src={item.image} alt={item.name}/> : <PackageCheck size={27}/>}<span>{item.category}</span></div><div className="catalogue-info"><small>{item.sku}</small><h3>{item.name}</h3><p>{item.unitPrice ? `${money(item.unitPrice)} / pc` : "Price to be added"}</p><button className="edit-product"><Pencil size={13}/> Edit product</button></div></article>)}{!items.length && <div className="empty">No catalogue products match your search.</div>}</section></section>;
}
function CatalogueModal({ item, close, save }: { item: CatalogueItem | null; close: () => void; save: (item: CatalogueItem) => void }) {
  const initial = item || { id: Date.now(), name: "", sku: "", unitPrice: 0, category: "Party Props", image: "" };
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(initial.image);
  const update = (key: keyof CatalogueItem, value: string | number) => setForm({ ...form, [key]: value });
  const chooseImage = (file?: File) => { if (!file) return; const image = URL.createObjectURL(file); setPreview(image); setForm({ ...form, image }); };
  return <Shell close={close}><div className="order-modal-head"><div className="modal-mark"><PackageCheck size={22}/></div><div><span className="overline">PRODUCT CATALOGUE</span><h2>{item ? "Edit product" : "Add a product"}</h2><p>This SKU will be used to recognise future orders.</p></div></div><label className="catalogue-upload">{preview ? <img src={preview} alt="Product preview"/> : <><ImagePlus size={23}/><b>Upload product image</b><span>PNG or JPG</span></>}<input type="file" accept="image/*" onChange={(e) => chooseImage(e.target.files?.[0])}/></label><div className="form-row"><label>Product name<input value={form.name} onChange={(e) => update("name", e.target.value)} required/></label><label>SKU ID<input value={form.sku} onChange={(e) => update("sku", e.target.value.toUpperCase())} placeholder="AB-981" required/></label></div><div className="form-row"><label>Unit price (₹)<input type="number" min="0" value={form.unitPrice || ""} onChange={(e) => update("unitPrice", Number(e.target.value))} required/></label><label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}>{["Balloons", "Party Props", "Cake Accessories", "Decorations", "Themed Parties"].map((value) => <option key={value}>{value}</option>)}</select></label></div><button className="primary modal-submit" type="button" onClick={() => save(form)}>Save to catalogue</button></Shell>;
}
function ClientModal({
  client,
  close,
  save,
}: {
  client: Client | null;
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
  };
  const [f, setF] = useState(initial),
    set = (k: keyof Client, v: string) => setF({ ...f, [k]: v });
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
