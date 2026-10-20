import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X, Phone } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ADDRESS, MAPS, PHONE, WHATSAPP } from "../config";
import { listProducts, priceRange, STOCK_LABEL, type Product } from "../lib/store";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "Namaste! Main Denim ka AI assistant hoon, 24/7 madad ke liye. Products, price, size, stock ya shop timing, kuch bhi poochiye.",
};
const QUICK = ["Shop kahan hai?", "Jeans ke options?", "Size kaise choose karun?"];

/* ---------- offline helper: used when the AI server cannot answer ---------- */
const has = (q: string, words: string[]) => words.some((w) => q.includes(w));
const rs = (n: number) => `Rs ${n}`;

function describe(p: Product): string {
  const { min, max } = priceRange(p);
  const price = min === max ? rs(min) : `${rs(min)} - ${rs(max)}`;
  const sizes = p.sizes.length ? `\nSizes: ${p.sizes.join(", ")}` : "";
  const colours = p.colours.filter((c) => c.available).map((c) => c.name).join(", ");
  return `${p.name} - ${price} (${STOCK_LABEL[p.status]})${sizes}${colours ? `\nColours: ${colours}` : ""}`;
}

async function localAnswer(raw: string): Promise<string | null> {
  const q = raw.toLowerCase();
  const visit = "Website se product, colour aur size chunke \"Visit shop\" dabaiye, shop owner ko turant pata chal jayega. Phir aap shop par aa sakte hain.";

  if (has(q, ["kahan", "kaha ", "address", "location", "where", "map", "direction", "rasta", "pata"]))
    return `Hamari shop: ${ADDRESS}\nMap: ${MAPS}`;
  if (has(q, ["phone", "call", "number", "contact", "mobile", "baat"]))
    return `Aap seedha is number par call kar sakte hain: ${PHONE}`;
  if (has(q, ["timing", "time", "open", "close", "band", "khula", "khulta", "kab tak", "kitne baje"]))
    return `Shop roz subah se raat tak khuli rehti hai. Exact timing ke liye ${PHONE} par call kar lijiye.`;
  if (has(q, ["online", "delivery", "payment", "pay ", "order", "cod", "courier"]))
    return `Ye showcase website hai, yahan online payment ya delivery nahi hai. ${visit}`;
  if (has(q, ["hello", "hi", "hii", "namaste", "hey"]) && q.length < 15)
    return "Namaste! Products, price, size, stock ya shop ka address, kuch bhi poochiye.";

  let products: Product[] = [];
  try { products = await listProducts(); } catch { /* ignore */ }

  if (products.length) {
    const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !["the", "hai", "kya", "ka", "ki", "ke", "mai", "mein", "hain", "kitna", "kitne", "price", "rate"].includes(w));
    const hits = products.filter((p) => {
      const hay = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      return words.some((w) => hay.includes(w) || (w.length > 3 && hay.includes(w.replace(/s$/, ""))));
    });
    if (hits.length) return `${hits.slice(0, 4).map(describe).join("\n\n")}${hits.length > 4 ? `\n\n...aur ${hits.length - 4} products website par hain.` : ""}\n\n${visit}`;

    if (has(q, ["price", "rate", "kimat", "kitne", "kitna", "cost", "daam", "dam"]))
      return `Kuch products:\n${products.slice(0, 5).map(describe).join("\n\n")}\n\nPura list website par dekh sakte hain.`;
    if (has(q, ["product", "option", "collection", "kya milta", "available", "stock", "jeans", "shirt", "jacket"]))
      return `Website par abhi ye products hain:\n${products.slice(0, 6).map((p) => `- ${p.name} (${STOCK_LABEL[p.status]})`).join("\n")}`;
  }

  if (has(q, ["size", "naap", "fit"]))
    return "Size ke liye apni kamar (waist) ka naap lijiye ya jo jeans pehle pehni hai uska size dekhiye. Har product ke card par available sizes dikhte hain. Pakka na ho toh shop par try kar sakte hain.";
  if (has(q, ["visit", "kaise", "how", "use"])) return visit;
  return null;
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy, open]);

  async function send(raw: string) {
    const q = raw.trim().slice(0, 500);
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setText("");
    setFailed(false);
    setBusy(true);
    try {
      if (!supabase) throw new Error("demo");
      const history = next.slice(1).slice(-10); // skip the greeting, keep the last 10 messages
      const { data, error } = await supabase.functions.invoke("ai-support", { body: { messages: history } });
      if (error || !data?.reply) {
        let detail = "";
        try { detail = await (error as { context?: Response } | null)?.context?.text() ?? ""; } catch { /* ignore */ }
        console.warn("[Denim support] AI server error:", error?.message ?? "no reply", detail || data);
        throw new Error("fail");
      }
      setMsgs([...next, { role: "assistant", content: String(data.reply) }]);
    } catch {
      // AI unavailable: answer from shop details + product list instead of just showing a phone number
      const local = await localAnswer(q).catch(() => null);
      if (local) {
        setMsgs([...next, { role: "assistant", content: local }]);
      } else {
        setFailed(true);
        setMsgs([...next, { role: "assistant", content: `Is sawal ka jawab mere paas nahi hai. Aap seedha call ya WhatsApp kar sakte hain: ${PHONE}` }]);
      }
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); void send(text); }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open AI help and support"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-denim-deep px-5 py-3 font-bold text-white shadow-xl hover:bg-denim">
          <MessageCircle size={20} /> Help 24/7
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Denim AI support"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(34rem,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
          <div className="twill-deep flex items-center justify-between px-4 py-3 text-white">
            <div>
              <p className="font-display text-lg font-extrabold leading-tight">Denim Help</p>
              <p className="text-xs text-denim-sky">AI assistant · 24/7</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/10"><X /></button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-denim-wash p-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${m.role === "user" ? "bg-denim-deep text-white" : "bg-white text-denim-deep"}`}>{m.content}</p>
              </div>
            ))}
            {busy && <p className="text-sm text-denim">Typing...</p>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => void send(q)} className="rounded-full border-2 border-denim-sky bg-white px-3 py-1.5 text-sm font-medium hover:bg-denim-sky">{q}</button>
                ))}
              </div>
            )}
            {failed && (
              <div className="flex gap-2">
                <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-4 py-2 text-sm font-bold text-white"><Phone size={14} /> Call</a>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-4 py-2 text-sm font-bold"><MessageCircle size={14} /> WhatsApp</a>
              </div>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-denim-sky bg-white p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Apna sawal likhiye..."
              aria-label="Your message" className="min-w-0 flex-1 rounded-full border-2 border-denim-sky px-4 py-2.5" />
            <button disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-denim-deep text-white hover:bg-denim disabled:opacity-50"><Send size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
}
