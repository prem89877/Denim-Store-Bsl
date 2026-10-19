import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X, Phone } from "lucide-react";
import { supabase } from "../lib/supabase";
import { PHONE, WHATSAPP } from "../config";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "Namaste! Main Denim ka AI assistant hoon, 24/7 madad ke liye. Products, price, size, stock ya shop timing, kuch bhi poochiye.",
};
const QUICK = ["Shop kahan hai?", "Jeans ke options?", "Size kaise choose karun?"];

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
      if (error || !data?.reply) throw new Error("fail");
      setMsgs([...next, { role: "assistant", content: String(data.reply) }]);
    } catch {
      setFailed(true);
      setMsgs([...next, { role: "assistant", content: `Abhi AI jawab nahi de pa raha. Aap seedha call ya WhatsApp kar sakte hain: ${PHONE}` }]);
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
