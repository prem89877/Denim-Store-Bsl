import { useEffect, useState, type FormEvent } from "react";
import { Shirt, X, Navigation, MessageCircle, CheckCircle2, Store } from "lucide-react";
import { listProducts, createVisit, STOCK_LABEL, type Product } from "../lib/store";
import { inr, validMobile } from "../lib/utils";
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

  const chosen = p.colours.find((c) => c.name === colour);
  const photos = chosen && chosen.images.length > 0 ? chosen.images : p.images;
  const needsColour = p.colours.length > 0;
  const needsSize = p.sizes.length > 0;
  const ready = (!needsSize || size !== null) && (!needsColour || colour !== null);
  const soldOut = p.status === "out_of_stock";

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
              <span className="font-display text-3xl font-extrabold text-denim">{inr(p.price)}</span>
              {p.mrp && p.mrp > p.price && <span className="text-denim-deep/50 line-through">{inr(p.mrp)}</span>}
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
                    <legend className="mb-2 font-bold">Colour{colour ? `: ${colour}` : ""}</legend>
                    <div className="flex flex-wrap gap-3">
                      {p.colours.map((c) => (
                        <button type="button" key={c.name} disabled={!c.available} onClick={() => pickColour(c.name)}
                          aria-label={c.available ? c.name : `${c.name} (not available)`} aria-pressed={colour === c.name} title={c.name}
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
  const [open, setOpen] = useState<Product | null>(null);

  useEffect(() => {
    listProducts().then(setProducts).catch((e: Error) => setError(e.message));
  }, []);

  const cats = ["All", ...CATEGORIES.filter((c) => products?.some((p) => p.category === c))];
  const shown = (products ?? []).filter((p) => cat === "All" || p.category === cat);

  return (
    <section id="products" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-4xl font-extrabold md:text-5xl">What we bring to the rack</h2>
      <p className="mt-3 max-w-xl text-denim">Tap a style, pick your size and let the shop know you are coming. Try every piece in store.</p>

      {cats.length > 2 && (
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              className={`rounded-full px-5 py-2 font-medium ${cat === c ? "bg-denim-deep text-white" : "bg-denim-wash text-denim-deep hover:bg-denim-sky"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-8 text-tag">{error}</p>}
      {!products && !error && <p className="mt-10 text-denim">Loading styles...</p>}
      {products && shown.length === 0 && <p className="mt-10 rounded-2xl bg-denim-wash p-8 text-denim">New styles are coming soon. Visit the store to see our full range.</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {shown.map((p) => (
          <button key={p.id} onClick={() => setOpen(p)}
            className="seam group overflow-hidden rounded-2xl bg-white text-left transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative">
              <Photo src={p.images[0]} alt={p.name} className="aspect-[4/5] w-full" />
              {p.status !== "in_stock" && <span className={`absolute left-3 top-3 rounded px-2 py-1 text-xs font-bold ${p.status === "out_of_stock" ? "bg-tag text-white" : "bg-stitch text-denim-deep"}`}>{STOCK_LABEL[p.status]}</span>}
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-rivet">{p.category}</p>
              <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-bold text-denim">{inr(p.price)}</span>
                {p.mrp && p.mrp > p.price && <span className="text-sm text-denim-deep/50 line-through">{inr(p.mrp)}</span>}
              </p>
              {p.colours.length > 0 && (
                <div className="mt-2 flex gap-1.5" aria-label="Available colours">
                  {p.colours.slice(0, 6).map((c) => <span key={c.name} title={c.name} className={`h-4 w-4 rounded-full border border-denim-sky ${c.available ? "" : "opacity-30"}`} style={{ backgroundColor: c.hex }} />)}
                </div>
              )}
              {p.sizes.length > 0 && <p className="mt-1 truncate text-xs text-denim-deep/70">Sizes: {p.sizes.join(", ")}</p>}
            </div>
          </button>
        ))}
      </div>

      {open && <ProductModal p={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
