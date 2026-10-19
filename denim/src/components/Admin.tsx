import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Bell, BellRing, Phone, MessageCircle, Plus, Trash2, Pencil, LogOut, ArrowLeft, Check, ImagePlus, X } from "lucide-react";
import {
  adminSignIn, adminSignOut, deleteProduct, deleteVisit, isAdminSession, isCloud, listProducts, listVisits,
  markVisitSeen, saveProduct, savePushSubscription, setStockStatus, subscribeVisits, uploadImage, STOCK_LABEL,
  type ColourOption, type Product, type ProductInput, type StockStatus, type VisitRequest,
} from "../lib/store";
import { askNotifyPermission, notifyAdmin, pushSupported, subscribePush } from "../pwa";
import { inr, when } from "../lib/utils";
import { CATEGORIES, COLOUR_PRESETS, MAX_COLOUR_IMAGES, MAX_PRODUCT_IMAGES, SIZE_PRESETS } from "../config";

const field = "mt-1 w-full rounded-lg border-2 border-denim-sky bg-white px-3 py-2.5";

function Login({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await adminSignIn(id.trim(), secret);
      onDone();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="twill grid min-h-screen place-items-center p-5">
      <form onSubmit={submit} className="seam w-full max-w-sm rounded-2xl bg-white p-7">
        <img src="/denim-logo.png" alt="Denim" className="h-10 w-auto" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Admin login</h1>
        {isCloud ? (
          <label className="mt-4 block text-sm font-medium">Email
            <input type="email" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" required className={field} />
          </label>
        ) : (
          <p className="mt-2 text-sm text-denim-deep/70">Demo mode: data is saved only in this browser.</p>
        )}
        <label className="mt-4 block text-sm font-medium">{isCloud ? "Password" : "Passcode"}
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="current-password" required className={field} />
        </label>
        {err && <p role="alert" className="mt-3 text-sm font-medium text-tag">{err}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-denim-deep px-6 py-3 font-bold text-white hover:bg-denim disabled:opacity-60">
          {busy ? "Please wait..." : "Login"}
        </button>
        <a href="#/" className="mt-4 block text-center text-sm text-denim hover:text-rivet">Back to website</a>
      </form>
    </div>
  );
}

function ImageStrip({ images, max, onChange, onError, label }: {
  images: string[]; max: number; onChange: (next: string[]) => void; onError: (m: string) => void; label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function add(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, max - images.length)) urls.push(await uploadImage(f));
      onChange([...images, ...urls]);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((u, i) => (
        <div key={u.slice(-24) + i} className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-denim-sky">
          <img src={u} alt="" className="h-full w-full object-cover" />
          <button type="button" aria-label="Remove photo" onClick={() => onChange(images.filter((_, j) => j !== i))}
            className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5"><X size={14} /></button>
        </div>
      ))}
      {images.length < max && (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} aria-label={label}
          className="grid h-20 w-20 place-items-center rounded-lg border-2 border-dashed border-denim text-denim hover:bg-denim-wash disabled:opacity-50">
          {busy ? <span className="text-xs">Wait...</span> : <ImagePlus />}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [mrp, setMrp] = useState(initial?.mrp ? String(initial.mrp) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [custom, setCustom] = useState("");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [colours, setColours] = useState<ColourOption[]>(initial?.colours ?? []);
  const [newColour, setNewColour] = useState("");
  const [newHex, setNewHex] = useState("#2F5486");
  const [status, setStatus] = useState<StockStatus>(initial?.status ?? "in_stock");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (s: string) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const sizeOptions = [...SIZE_PRESETS, ...sizes.filter((s) => !SIZE_PRESETS.includes(s))];

  function addColour(n: string, hex: string) {
    const nm = n.trim();
    if (!nm) return;
    if (colours.some((c) => c.name.toLowerCase() === nm.toLowerCase())) return setErr(`${nm} is already added`);
    setErr("");
    setColours([...colours, { name: nm, hex, images: [], available: true }]);
    setNewColour("");
  }
  const patchColour = (i: number, patch: Partial<ColourOption>) =>
    setColours((cur) => cur.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const p = Number(price);
    const m = mrp ? Number(mrp) : null;
    if (!name.trim()) return setErr("Product name is required");
    if (!Number.isFinite(p) || p <= 0) return setErr("Enter a valid price");
    if (images.length < 1) return setErr("Add at least 1 product photo (maximum 5)");
    setBusy(true);
    setErr("");
    try {
      const input: ProductInput = { id: initial?.id, name: name.trim(), category, price: p, mrp: m, description: description.trim(), sizes, images, colours, status };
      await saveProduct(input);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-denim-deep/70 sm:items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Product form"
        className="max-h-[94vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{initial ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-denim-wash"><X /></button>
        </div>

        <div>
          <p className="text-sm font-medium">Product photos <span className="text-denim-deep/60">({images.length}/{MAX_PRODUCT_IMAGES}, minimum 1)</span></p>
          <div className="mt-2"><ImageStrip images={images} max={MAX_PRODUCT_IMAGES} onChange={setImages} onError={setErr} label="Add product photo" /></div>
        </div>

        <label className="block text-sm font-medium">Product name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Price (₹)
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={field} />
          </label>
          <label className="block text-sm font-medium">Old price (optional)
            <input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" className={field} />
          </label>
        </div>
        <label className="block text-sm font-medium">Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Stock status
          <select value={status} onChange={(e) => setStatus(e.target.value as StockStatus)} className={field}>
            {(Object.keys(STOCK_LABEL) as StockStatus[]).map((k) => <option key={k} value={k}>{STOCK_LABEL[k]}</option>)}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium">Available sizes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizeOptions.map((s) => (
              <button type="button" key={s} onClick={() => toggle(s)} aria-pressed={sizes.includes(s)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold ${sizes.includes(s) ? "border-denim-deep bg-denim-deep text-white" : "border-denim-sky"}`}>{s}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom size, e.g. 42" className="w-full rounded-lg border-2 border-denim-sky px-3 py-2" />
            <button type="button" onClick={() => { const c = custom.trim(); if (c && !sizes.includes(c)) setSizes([...sizes, c]); setCustom(""); }}
              className="rounded-lg bg-denim-wash px-4 font-bold">Add</button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Colour options <span className="text-denim-deep/60">(each colour can have up to {MAX_COLOUR_IMAGES} photos)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOUR_PRESETS.filter((c) => !colours.some((x) => x.name === c.name)).map((c) => (
              <button type="button" key={c.name} onClick={() => addColour(c.name, c.hex)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-denim-sky px-3 py-1 text-sm font-medium hover:bg-denim-wash">
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} /> {c.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input type="color" value={newHex} onChange={(e) => setNewHex(e.target.value)} aria-label="Colour swatch" className="h-11 w-12 shrink-0 rounded-lg border-2 border-denim-sky bg-white p-1" />
            <input value={newColour} onChange={(e) => setNewColour(e.target.value)} placeholder="Custom colour name" className="w-full rounded-lg border-2 border-denim-sky px-3 py-2" />
            <button type="button" onClick={() => addColour(newColour, newHex)} className="rounded-lg bg-denim-wash px-4 font-bold">Add</button>
          </div>

          <ul className="mt-3 space-y-3">
            {colours.map((c, i) => (
              <li key={c.name} className="rounded-xl border-2 border-denim-sky p-3">
                <div className="flex items-center gap-3">
                  <input type="color" value={c.hex} onChange={(e) => patchColour(i, { hex: e.target.value })} aria-label={`${c.name} swatch`} className="h-9 w-10 shrink-0 rounded border border-denim-sky bg-white p-0.5" />
                  <p className="flex-1 font-bold">{c.name}</p>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={c.available} onChange={(e) => patchColour(i, { available: e.target.checked })} className="h-4 w-4" /> Available
                  </label>
                  <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setColours(colours.filter((_, j) => j !== i))} className="rounded-full p-1 text-tag hover:bg-tag/10"><Trash2 size={16} /></button>
                </div>
                <p className="mb-2 mt-3 text-xs text-denim-deep/60">{c.name} photos ({c.images.length}/{MAX_COLOUR_IMAGES}). If empty, product photos are shown.</p>
                <ImageStrip images={c.images} max={MAX_COLOUR_IMAGES} onChange={(next) => patchColour(i, { images: next })} onError={setErr} label={`Add ${c.name} photo`} />
              </li>
            ))}
          </ul>
        </div>

        <label className="block text-sm font-medium">Details / description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={field} placeholder="Fabric, fit, wash, care..." />
        </label>

        {err && <p role="alert" className="text-sm font-medium text-tag">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-denim-deep px-6 py-3 font-bold text-white hover:bg-denim disabled:opacity-60">
          {busy ? "Please wait..." : "Save product"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onOut }: { onOut: () => void }) {
  const [tab, setTab] = useState<"visits" | "products">("visits");
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [toast, setToast] = useState<VisitRequest | null>(null);
  const [perm, setPerm] = useState<string>("Notification" in window ? Notification.permission : "unsupported");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const [v, p] = await Promise.all([listVisits(), listProducts()]);
      setVisits(v);
      setProducts(p);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Could not load data");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  /* keep this device registered for push notifications once permission was given */
  useEffect(() => {
    if (perm === "granted" && pushSupported()) {
      subscribePush().then((sub) => (sub ? savePushSubscription(sub) : undefined)).catch(() => undefined);
    }
  }, [perm]);

  useEffect(() => {
    return subscribeVisits((v) => {
      setVisits((cur) => (cur.some((x) => x.id === v.id) ? cur : [v, ...cur]));
      setToast(v);
      navigator.vibrate?.(200);
      void notifyAdmin("New shop visit request", `${v.customerName} (${v.mobile}) - ${v.productName}${v.colour ? ", " + v.colour : ""}, size ${v.size}`);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const unseen = visits.filter((v) => v.status === "new").length;
  useEffect(() => {
    document.title = unseen ? `(${unseen}) Denim Admin` : "Denim Admin";
    return () => { document.title = "Denim | Bhusawal"; };
  }, [unseen]);

  async function run(fn: () => Promise<void>) {
    try { await fn(); await reload(); } catch (ex) { setError(ex instanceof Error ? ex.message : "Action failed"); }
  }

  return (
    <div className="min-h-screen bg-denim-wash">
      <header className="twill-deep text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <a href="#/" className="inline-flex items-center gap-2 text-sm text-denim-sky hover:text-white"><ArrowLeft size={16} /> Website</a>
          <img src="/denim-logo.png" alt="Denim" className="h-8 w-auto" />
          <button onClick={onOut} className="inline-flex items-center gap-2 text-sm text-denim-sky hover:text-white"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        {perm !== "granted" && perm !== "unsupported" && (
          <button onClick={async () => setPerm(await askNotifyPermission())}
            className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-stitch p-4 text-left font-bold text-denim-deep">
            <Bell /> Tap to turn on notifications for new shop visit requests
          </button>
        )}
        {perm === "granted" && (
          <p className="mb-5 flex items-center gap-2 text-sm text-denim">
            <BellRing size={16} /> Notifications are on{!pushSupported() && " (works while this app is open; phone push needs the VAPID key, see README)"}
          </p>
        )}
        {error && <p role="alert" className="mb-4 rounded-lg bg-white p-3 text-tag">{error}</p>}

        <div className="flex gap-2">
          {(["visits", "products"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
              className={`relative rounded-full px-6 py-2.5 font-bold ${tab === t ? "bg-denim-deep text-white" : "bg-white text-denim-deep"}`}>
              {t === "visits" ? "Visit requests" : "Products"}
              {t === "visits" && unseen > 0 && <span className="ml-2 rounded-full bg-tag px-2 py-0.5 text-xs text-white">{unseen}</span>}
            </button>
          ))}
        </div>

        {tab === "visits" && (
          <ul className="mt-5 space-y-3">
            {visits.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-denim">No visit requests yet.</li>}
            {visits.map((v) => (
              <li key={v.id} className={`rounded-2xl bg-white p-5 ${v.status === "new" ? "border-l-8 border-tag" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-bold">{v.customerName}</p>
                    <p className="text-lg font-medium text-denim">{v.mobile}</p>
                  </div>
                  <p className="text-right text-sm text-denim-deep/70">{when(v.createdAt)}</p>
                </div>
                <p className="mt-2">Wants to visit for <b>{v.productName}</b>{v.colour && <>, colour <b>{v.colour}</b></>}, size <b>{v.size}</b></p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${v.mobile}`} className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-4 py-2 text-sm font-bold text-white"><Phone size={14} /> Call</a>
                  <a href={`https://wa.me/91${v.mobile}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-4 py-2 text-sm font-bold"><MessageCircle size={14} /> WhatsApp</a>
                  {v.status === "new" && (
                    <button onClick={() => run(() => markVisitSeen(v.id))} className="inline-flex items-center gap-2 rounded-full bg-denim-wash px-4 py-2 text-sm font-bold"><Check size={14} /> Mark seen</button>
                  )}
                  <button onClick={() => confirm("Delete this request?") && run(() => deleteVisit(v.id))} aria-label="Delete request" className="rounded-full p-2 text-tag hover:bg-tag/10"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "products" && (
          <div className="mt-5">
            <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-full bg-stitch px-6 py-3 font-bold text-denim-deep"><Plus size={18} /> Add product</button>
            <ul className="mt-4 space-y-3">
              {products.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-denim">No products yet.</li>}
              {products.map((p) => (
                <li key={p.id} className="flex items-center gap-4 rounded-2xl bg-white p-3">
                  {p.images[0]
                    ? <img src={p.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    : <div className="twill h-16 w-16 shrink-0 rounded-lg" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="text-sm text-denim-deep/70">{inr(p.price)} · {p.sizes.join(", ") || "No sizes"}{p.colours.length > 0 && ` · ${p.colours.length} colours`}</p>
                    <select value={p.status} onChange={(e) => run(() => setStockStatus(p.id, e.target.value as StockStatus))} aria-label={`Stock status of ${p.name}`}
                      className={`mt-1 rounded-lg border-2 px-2 py-1 text-sm font-bold ${p.status === "in_stock" ? "border-denim-sky" : p.status === "low_stock" ? "border-stitch bg-stitch/20" : "border-tag text-tag"}`}>
                      {(Object.keys(STOCK_LABEL) as StockStatus[]).map((k) => <option key={k} value={k}>{STOCK_LABEL[k]}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setEditing(p)} aria-label="Edit" className="rounded-full p-2 hover:bg-denim-wash"><Pencil size={18} /></button>
                  <button onClick={() => confirm(`Delete ${p.name}?`) && run(() => deleteProduct(p.id))} aria-label="Delete" className="rounded-full p-2 text-tag hover:bg-tag/10"><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {toast && (
        <div role="status" className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md rounded-2xl bg-tag p-4 text-white shadow-2xl">
          <p className="flex items-center gap-2 font-bold"><BellRing size={18} /> New shop visit request</p>
          <p className="mt-1">{toast.customerName} · {toast.mobile}</p>
          <p className="text-sm text-white/90">{toast.productName}{toast.colour ? `, ${toast.colour}` : ""}, size {toast.size}</p>
        </div>
      )}

      {editing && (
        <ProductForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }} />
      )}
    </div>
  );
}

export default function Admin() {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  useEffect(() => { isAdminSession().then((a) => setState(a ? "in" : "out")); }, []);
  if (state === "loading") return <div className="grid min-h-screen place-items-center text-denim">Loading...</div>;
  if (state === "out") return <Login onDone={() => setState("in")} />;
  return <Dashboard onOut={async () => { await adminSignOut(); setState("out"); }} />;
}
