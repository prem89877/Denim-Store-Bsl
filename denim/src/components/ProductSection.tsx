import { useEffect, useState, type FormEvent } from "react";
import { Shirt, X, Navigation, MessageCircle, CheckCircle2, Store, ArrowRight, Search } from "lucide-react";
import { listProducts, createVisit, priceFor, priceRange, STOCK_LABEL, type Product } from "../lib/store";
import { inr, validMobile } from "../lib/utils";
import { useCustomer } from "./CustomerAuth";
import { ADDRESS, CATEGORIES, MAPS, WHATSAPP } from "../config";

const CUSTOMER_KEY = "denim.customer";
function readCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}") as { name?: string; mobile?: string };
  } catch {
    return {};
  }
}

function Photo({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`twill grid place-items-center text-white/70 ${className}`} aria-label={alt}>
      <Shirt size={40} />
    </div>
  );
}

function ProductModal({ p, onClose }: { p: Product; onClose: () => void }) {
  const saved = readCustomer();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "form" | "done">("pick");
  const [name, setName] = useState(saved.name ?? "");
  const [mobile, setMobile] = useState(saved.mobile ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const customer = useCustomer();
  useEffect(() => {
    if (customer && !name) setName(customer.name);
  }, [customer]);

  const chosen = p.colours.find((c) => c.name === colour);
  const photos = chosen && chosen.images.length > 0 ? chosen.images : p.images;
  const needsColour = p.colours.length > 0;
  const needsSize = p.sizes.length > 0;
  const ready = (!needsSize || size !== null) && (!needsColour || colour !== null);
  const soldOut = p.status === "out_of_stock";
  const range = priceRange(p);
  const varies = range.min !== range.max;
  const unitPrice = priceFor(p, size, colour);
  const shownPrice = varies && !ready ? range.min : unitPrice;

  function pickColour(name: string) {
    setColour(name);
    setImg(0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const m = mobile.replace(/\D/g, "").slice(-10);
    if (n.length < 2) return setErr("Please enter your name");
    if (!validMobile(m)) return setErr("Please enter a valid 10 digit mobile number");
    if (needsSize && !size) return setErr("Please select a size");
    if (needsColour && !colour) return setErr("Please select a colour");
    setErr("");
    setBusy(true);
    try {
      await createVisit({ productId: p.id, productName: p.name, size: size ?? "Any", colour: colour ?? "", customerName: n, mobile: m });
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: n, mobile: m }));
      setMobile(m);
      setStep("done");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hi Denim, I am ${name.trim()} (${mobile}). I will visit the shop for ${p.name}${colour ? ", " + colour : ""}${size ? ", size " + size : ""}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-denim-deep/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={p.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div className="grid sm:grid-cols-2">
          <div className="relative bg-denim-wash">
            <Photo src={photos[img] ?? photos[0]} alt={p.name} className="aspect-square w-full" />
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {photos.map((u, i) => (
                  <button key={u + i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? "border-rivet" : "border-transparent"}`}>
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-rivet">{p.category}</p>
                <h3 className="font-display text-2xl font-extrabold leading-tight">{p.name}</h3>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-denim-wash"><X /></button>
            </div>

            <p className="mt-3 flex items-baseline gap-3">
              {varies && !ready && <span className="text-sm font-medium text-denim-deep/60">From</span>}
              <span className="font-display text-3xl font-extrabold text-denim">{inr(shownPrice)}</span>
              {!varies && p.mrp && p.mrp > unitPrice && <span className="text-denim-deep/50 line-through">{inr(p.mrp)}</span>}
            </p>
            {p.description && <p className="mt-3 text-denim-deep/80">{p.description}</p>}

            {step === "done" ? (
              <div className="mt-6 rounded-2xl bg-denim-wash p-5">
                <p className="flex items-center gap-2 font-display text-xl font-bold"><CheckCircle2 className="text-rivet" /> Thank you, {name.trim()}!</p>
                <p className="mt-2 text-denim-deep/80">
                  The shop has received your request for <b>{p.name}</b> ({[colour, size ? `size ${size}` : ""].filter(Boolean).join(", ")}). Please visit the store and we will keep it ready for you.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={MAPS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-5 py-2.5 font-bold text-white hover:bg-denim">
                    <Navigation size={16} /> Get directions
                  </a>
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-5 py-2.5 font-bold hover:bg-denim-deep hover:text-white">
                    <MessageCircle size={16} /> Also message on WhatsApp
                  </a>
                </div>
                <p className="mt-3 text-sm text-denim-deep/70">{ADDRESS}</p>
              </div>
            ) : soldOut ? (
              <p className="mt-6 rounded-xl bg-tag/10 p-4 font-medium text-tag">Currently out of stock. Please ask in store for similar styles.</p>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-5">
                {p.status === "low_stock" && <p className="inline-block rounded bg-stitch px-3 py-1 text-sm font-bold text-denim-deep">Only a few left</p>}
                {needsColour && (
                  <fieldset>
                    <legend className="mb-2 font-bold">Colour{colour ? `: ${colour}` : ""}{chosen?.price ? ` (${inr(chosen.price)})` : ""}</legend>
                    <div className="flex flex-wrap gap-3">
                      {p.colours.map((c) => (
                        <button type="button" key={c.name} disabled={!c.available} onClick={() => pickColour(c.name)}
                          aria-label={c.available ? c.name : `${c.name} (not available)`} aria-pressed={colour === c.name} title={c.price ? `${c.name} - ${inr(c.price)}` : c.name}
                          className={`relative h-10 w-10 rounded-full border-2 ${colour === c.name ? "ring-2 ring-denim-deep ring-offset-2" : ""} ${c.available ? "border-denim-sky" : "cursor-not-allowed opacity-40"}`}
                          style={{ backgroundColor: c.hex }}>
                          {!c.available && <span className="absolute inset-0 grid place-items-center text-lg font-bold text-tag">/</span>}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <fieldset>
                  <legend className="mb-2 font-bold">Select size</legend>
                  <div className="flex flex-wrap gap-2">
                    {!needsSize && <p className="text-sm text-denim-deep/70">Sizes available in store.</p>}
                    {p.sizes.map((s) => (
                      <button type="button" key={s} onClick={() => setSize(s)} aria-pressed={size === s}
                        className={`min-w-[3rem] rounded-lg border-2 px-3 py-2 font-bold ${size === s ? "border-denim-deep bg-denim-deep text-white" : "border-denim-sky hover:border-denim"}`}>
                        {s}
                        {p.sizePrices[s] ? <span className="block text-[11px] font-medium opacity-80">{inr(p.sizePrices[s])}</span> : null}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {step === "pick" ? (
                  <button type="button" disabled={!ready} onClick={() => setStep("form")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stitch px-7 py-3.5 font-bold text-denim-deep hover:bg-denim-deep hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                    <Store size={18} /> Visit shop
                  </button>
                ) : (
                  <div className="space-y-3 rounded-2xl bg-denim-wash p-4">
                    <p className="text-sm text-denim-deep/80">Share your details so the shop knows who is coming.</p>
                    <label className="block">
                      <span className="text-sm font-medium">Your name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                        className="mt-1 w-full rounded-lg border-2 border-denim-sky bg-white px-3 py-2.5" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">Mobile number</span>
                      <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" autoComplete="tel" maxLength={14}
                        className="mt-1 w-full rounded-lg border-2 border-denim-sky bg-white px-3 py-2.5" />
                    </label>
                    {err && <p role="alert" className="text-sm font-medium text-tag">{err}</p>}
                    <button type="submit" disabled={busy}
                      className="w-full rounded-full bg-denim-deep px-7 py-3 font-bold text-white hover:bg-denim disabled:opacity-60">
                      {busy ? "Sending..." : "Confirm shop visit"}
                    </button>
                  </div>
                )}
                {step === "pick" && err && <p role="alert" className="text-sm font-medium text-tag">{err}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductSection() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Product | null>(null);

  useEffect(() => {
    listProducts().then(setProducts).catch((e: Error) => setError(e.message));
  }, []);

  const cats = ["All", ...CATEGORIES.filter((c) => products?.some((p) => p.category === c))];
  const q = query.trim().toLowerCase();
  const shown = (products ?? []).filter(
    (p) => (cat === "All" || p.category === cat) && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  );
  const countOf = (c: string) => (products ?? []).filter((p) => c === "All" || p.category === c).length;

  return (
    <section id="products" className="bg-gradient-to-b from-denim-wash/70 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-rivet">Our collection</p>
        <h2 className="mt-2 font-display text-4xl font-extrabold leading-tight md:text-5xl">What we bring to the rack</h2>
        <p className="mt-3 max-w-xl text-denim">Tap a style, pick your colour and size, and let the shop know you are coming. Try every piece in store.</p>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {cats.length > 2 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                  className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm transition ${cat === c ? "bg-denim-deep text-white" : "bg-white text-denim-deep ring-1 ring-denim-sky hover:bg-denim-wash"}`}>
                  {c} <span className={cat === c ? "text-white/70" : "text-denim-deep/50"}>{countOf(c)}</span>
                </button>
              ))}
            </div>
          ) : <span />}
          {products && products.length > 0 && (
            <label className="relative block md:w-72">
              <span className="sr-only">Search products</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-denim" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search styles"
                className="w-full rounded-full border-0 bg-white py-3 pl-11 pr-4 shadow-sm ring-1 ring-denim-sky focus:outline-none focus:ring-2 focus:ring-denim" />
            </label>
          )}
        </div>

        {error && <p className="mt-8 rounded-2xl bg-white p-5 text-tag shadow-sm">{error}</p>}

        {!products && !error && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" aria-label="Loading styles">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-denim-sky/50">
                <div className="aspect-square bg-denim-wash" />
                <div className="space-y-3 p-4"><div className="h-4 w-3/4 rounded bg-denim-wash" /><div className="h-4 w-1/2 rounded bg-denim-wash" /></div>
              </div>
            ))}
          </div>
        )}

        {products && shown.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-denim-sky/60">
            <Shirt className="mx-auto text-denim" size={36} />
            <p className="mt-3 font-display text-xl font-bold">{products.length === 0 ? "New styles are coming soon" : "No styles match your search"}</p>
            <p className="mt-1 text-denim">Visit the store to see our full range.</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 items-stretch gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => {
            const { min, max } = priceRange(p);
            const from = min !== max;
            const off = !from && p.mrp && p.mrp > min ? Math.round((1 - min / p.mrp) * 100) : 0;
            return (
              <button key={p.id} onClick={() => setOpen(p)}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white text-left shadow-md ring-1 ring-denim-sky/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-square overflow-hidden bg-denim-wash">
                  <Photo src={p.images[0]} alt={p.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
                  {p.status !== "in_stock" && (
                    <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${p.status === "out_of_stock" ? "bg-tag text-white" : "bg-stitch text-denim-deep"}`}>
                      {STOCK_LABEL[p.status]}
                    </span>
                  )}
                  {off > 0 && <span className="absolute right-2 top-2 rounded-full bg-rivet px-2.5 py-1 text-[11px] font-bold text-white shadow">{off}% OFF</span>}
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-denim-deep shadow">{p.category}</span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                  <h3 className="break-words font-display text-base font-bold leading-snug">{p.name}</h3>

                  <p className="flex flex-wrap items-baseline gap-x-2">
                    {from && <span className="text-xs font-medium text-denim-deep/60">From</span>}
                    <span className="font-display text-xl font-extrabold text-denim">{inr(min)}</span>
                    {off > 0 && p.mrp && <span className="text-sm text-denim-deep/50 line-through">{inr(p.mrp)}</span>}
                  </p>

                  {p.colours.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-denim-deep/50">Colours</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.colours.map((c) => (
                          <span key={c.name} title={c.available ? c.name : `${c.name} (not available)`}
                            className={`h-5 w-5 rounded-full border border-black/10 ${c.available ? "" : "opacity-30"}`} style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {p.sizes.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-denim-deep/50">Sizes</p>
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span key={s} className="rounded-md bg-denim-wash px-1.5 py-0.5 text-[11px] font-bold text-denim-deep">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${p.status === "out_of_stock" ? "bg-denim-wash text-denim-deep" : "bg-denim-deep text-white group-hover:bg-rivet"}`}>
                    {p.status === "out_of_stock" ? "View details" : "Select & visit shop"} <ArrowRight size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {open && <ProductModal p={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
