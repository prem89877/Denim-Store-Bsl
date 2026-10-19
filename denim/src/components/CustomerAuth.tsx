import { useEffect, useState, type FormEvent } from "react";
import { LogIn, LogOut, UserRound, X } from "lucide-react";
import {
  customerGoogle, customerSignIn, customerSignOut, customerSignUp, getCustomer, isCloud, onAuthChange, type Customer,
} from "../lib/store";

/* the logged in customer (null when logged out or in demo mode) */
export function useCustomer(): Customer | null {
  const [customer, setCustomer] = useState<Customer | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getCustomer().then((c) => alive && setCustomer(c));
    void load();
    const off = onAuthChange(load);
    return () => { alive = false; off(); };
  }, []);
  return customer;
}

const input = "mt-1 w-full rounded-lg border-2 border-denim-sky bg-white px-3 py-2.5";

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (mode === "signup" && name.trim().length < 2) return setErr("Please enter your name");
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await customerSignUp(name.trim(), email.trim(), password);
        if (r === "confirm") return setInfo("Account created. Please open the link we emailed you to confirm, then login.");
      } else {
        await customerSignIn(email.trim(), password);
      }
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr("");
    try { await customerGoogle(); } catch (ex) { setErr(ex instanceof Error ? ex.message : "Google login failed"); }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-denim-deep/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Login or sign up" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <img src="/denim-logo.png" alt="Denim" className="h-8 w-auto" />
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-denim-wash"><X /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-denim-wash p-1">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setErr(""); setInfo(""); }} aria-pressed={mode === m}
              className={`rounded-full py-2 font-bold ${mode === m ? "bg-denim-deep text-white" : "text-denim-deep"}`}>
              {m === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <button onClick={google} type="button"
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border-2 border-denim-sky py-3 font-bold hover:bg-denim-wash">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-base font-extrabold text-[#4285F4] shadow">G</span>
          Continue with Google
        </button>

        <p className="my-4 text-center text-sm text-denim-deep/60">or use your email</p>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block text-sm font-medium">Your name
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
            </label>
          )}
          <label className="block text-sm font-medium">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={input} />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              autoComplete={mode === "signup" ? "new-password" : "current-password"} className={input} />
          </label>
          {err && <p role="alert" className="text-sm font-medium text-tag">{err}</p>}
          {info && <p role="status" className="text-sm font-medium text-denim">{info}</p>}
          <button disabled={busy} className="w-full rounded-full bg-denim-deep py-3 font-bold text-white hover:bg-denim disabled:opacity-60">
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* header button: "Login / Sign up" or "Hi, name + Logout" (hidden in demo mode) */
export function AccountMenu({ mobile = false }: { mobile?: boolean }) {
  const customer = useCustomer();
  const [open, setOpen] = useState(false);
  if (!isCloud) return null;

  const base = mobile
    ? "flex items-center gap-2 py-2 text-left font-medium text-denim"
    : "inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-4 py-2 font-medium hover:bg-denim-deep hover:text-white";

  return (
    <>
      {customer ? (
        <button onClick={() => customerSignOut()} className={base} title={customer.email}>
          <UserRound size={16} /> Hi, {customer.name.split(" ")[0]} <LogOut size={14} className="opacity-70" />
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className={base}><LogIn size={16} /> Login / Sign up</button>
      )}
      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
