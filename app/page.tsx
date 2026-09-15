"use client";

import { useMemo, useState } from "react";
import { Bell, Boxes, ChevronDown, CircleDollarSign, Clock3, Download, FileText, LayoutDashboard, MoreHorizontal, PackageCheck, Plus, Search, Settings, ShipWheel, Users, X } from "lucide-react";

const orders = [
  { id: "GB-24091", client: "Celebration Corner", city: "Mumbai", items: 28, value: "₹1,84,600", eta: "18 Sep", status: "In transit", payment: "Partial", avatar: "CC" },
  { id: "GB-24090", client: "Happy Times Retail", city: "Pune", items: 15, value: "₹96,450", eta: "22 Sep", status: "Confirmed", payment: "Paid", avatar: "HT" },
  { id: "GB-24089", client: "The Party Store", city: "Bengaluru", items: 42, value: "₹2,63,200", eta: "12 Sep", status: "Customs clearance", payment: "Overdue", avatar: "PS" },
  { id: "GB-24088", client: "Choco & Co.", city: "Ahmedabad", items: 9, value: "₹58,900", eta: "Delivered", status: "Delivered", payment: "Paid", avatar: "CO" },
];

const activities = [
  ["Payment received", "Happy Times Retail cleared INV-1018", "₹48,225 · 12 min ago", "money"],
  ["Shipment updated", "GB-24091 has departed Ningbo port", "45 min ago", "ship"],
  ["Invoice due tomorrow", "The Party Store · ₹1,31,600 pending", "2 hr ago", "invoice"],
  ["New client added", "Celebrate India was added by Riya", "Yesterday", "client"],
];

function Pill({ value }: { value: string }) { return <span className={`pill ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>; }

export default function Home() {
  const [section, setSection] = useState("Overview");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState("");
  const displayOrders = useMemo(() => orders.filter(order => `${order.id} ${order.client} ${order.city}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const nav = [[LayoutDashboard, "Overview"], [Users, "Clients"], [Boxes, "Orders", "4"], [FileText, "Invoices", "3"], [CircleDollarSign, "Payments", "2"], [ShipWheel, "Shipments"]] as const;
  return <main>
    <aside className="sidebar">
      <div className="brand"><div className="brand-word">GeeBee</div><small>THE PARTY FACTORY</small></div>
      <div className="workspace"><div className="workspace-icon">G</div><div><b>GeeBee Imports</b><span>Operations workspace</span></div><ChevronDown size={15}/></div>
      <nav>{nav.map(([Icon, label, count]) => <button key={label} className={section === label ? "active" : ""} onClick={() => setSection(label)}><Icon size={18}/><span>{label}</span>{count && <em>{count}</em>}</button>)}</nav>
      <div className="side-bottom"><button onClick={() => setSection("Settings")}><Settings size={18}/><span>Settings</span></button><div className="profile"><div className="avatar">RM</div><div><b>Rahul Maggu</b><span>Administrator</span></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <section className="content">
      <header><div className="mobile-brand">GeeBee</div><div className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients, orders, invoices..." /></div><button className="icon-btn"><Bell size={19}/><i/></button><div className="header-avatar">RM</div></header>
      <div className="page-head"><div><div className="eyebrow">MONDAY, 15 SEPTEMBER 2026</div><h1>{section === "Overview" ? "Good morning, Rahul" : section}</h1><p>{section === "Overview" ? "Here’s what’s happening with your import business." : `Manage your ${section.toLowerCase()} from one place.`}</p></div><button className="primary" onClick={() => setOpenModal(true)}><Plus size={18}/> New order</button></div>
      <div className="metrics"><Metric label="Orders in progress" value="24" change="+4 this week" icon={<PackageCheck/>} kind="burgundy"/><Metric label="Expected receivables" value="₹8.42L" change="₹2.16L overdue" icon={<CircleDollarSign/>} kind="coral"/><Metric label="Shipments in transit" value="8" change="Next arrival 18 Sep" icon={<ShipWheel/>} kind="gold"/><Metric label="Active clients" value="126" change="+9 this month" icon={<Users/>} kind="violet"/></div>
      <div className="grid-main"><section className="panel orders-panel"><div className="panel-head"><div><h2>Recent orders</h2><p>Track the latest purchase orders and delivery progress.</p></div><button className="text-btn" onClick={() => setSection("Orders")}>View all <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>ORDER</th><th>CLIENT</th><th>ITEMS</th><th>VALUE</th><th>ETA</th><th>STATUS</th><th>PAYMENT</th></tr></thead><tbody>{displayOrders.map(order => <tr key={order.id}><td><b>{order.id}</b></td><td><div className="client"><span className="mini-avatar">{order.avatar}</span><div><b>{order.client}</b><small>{order.city}</small></div></div></td><td>{order.items} SKUs</td><td><b>{order.value}</b></td><td>{order.eta}</td><td><Pill value={order.status}/></td><td><Pill value={order.payment}/></td></tr>)}</tbody></table>{!displayOrders.length && <div className="empty">No records match “{search}”.</div>}</div></section>
      <aside className="side-column"><section className="panel collection"><div className="panel-head"><div><h2>Collection health</h2><p>September, 2026</p></div><button className="dots"><MoreHorizontal size={19}/></button></div><div className="ring-row"><div className="ring"><div><b>72%</b><small>Collected</small></div></div><div className="collection-data"><div><span className="dot paid"></span><p>Collected <b>₹6.12L</b></p></div><div><span className="dot pending"></span><p>Pending <b>₹2.30L</b></p></div><div><span className="dot late"></span><p>Overdue <b>₹1.48L</b></p></div></div></div><button className="outline" onClick={() => flash("Opening payment follow-ups")}>Review payment follow-ups <span>→</span></button></section>
      <section className="panel activity"><div className="panel-head"><div><h2>Activity</h2></div><button className="text-btn" onClick={() => flash("All activity is up to date")}>View all</button></div>{activities.map(([title, desc, time, type]) => <div className="activity-item" key={title}><div className={`activity-icon ${type}`}>{type === "ship" ? <ShipWheel size={16}/> : type === "money" ? <CircleDollarSign size={16}/> : type === "invoice" ? <FileText size={16}/> : <Users size={16}/>}</div><div><b>{title}</b><p>{desc}</p><small>{time}</small></div></div>)}</section></aside></div>
      <section className="bottom-row"><section className="panel deadline"><div className="deadline-icon"><Clock3 size={22}/></div><div><h3>3 payments need attention</h3><p>₹1,48,600 is overdue. Follow up to keep your cash flow healthy.</p></div><button className="primary compact" onClick={() => flash("Payment reminder queue opened")}>Send reminders</button></section><section className="panel shipment"><div><span className="plane">✦</span><b>Next container arrives in 3 days</b><p>Container <strong>GB-CN-2409</strong> · Nhava Sheva</p></div><button className="text-btn" onClick={() => flash("Shipment timeline opened")}>Track shipment →</button></section></section>
    </section>
    {openModal && <div className="modal-backdrop" onMouseDown={() => setOpenModal(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => {e.preventDefault(); setOpenModal(false); flash("Order GB-24092 created successfully");}}><button type="button" className="close" onClick={() => setOpenModal(false)}><X size={19}/></button><div className="modal-mark"><PackageCheck size={22}/></div><h2>Create a new order</h2><p>Add an importer purchase order to start tracking it.</p><label>Client<select defaultValue=""><option value="" disabled>Select a client</option><option>Celebration Corner</option><option>Happy Times Retail</option><option>The Party Store</option></select></label><div className="form-row"><label>Order value<input placeholder="₹ 0.00" required/></label><label>Expected arrival<input type="date" required/></label></div><label>Order status<select defaultValue="Confirmed"><option>Confirmed</option><option>Production</option><option>In transit</option></select></label><button className="primary modal-submit" type="submit">Create order</button></form></div>}
    {toast && <div className="toast"><PackageCheck size={18}/>{toast}</div>}
  </main>;
}

function Metric({ label, value, change, icon, kind }: { label: string; value: string; change: string; icon: React.ReactNode; kind: string }) { return <section className="metric"><div className={`metric-icon ${kind}`}>{icon}</div><div><p>{label}</p><h2>{value}</h2><small>{change}</small></div></section>; }
