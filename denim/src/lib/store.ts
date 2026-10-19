import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { DEMO_ADMIN_PASSCODE } from "../config";
import { blobToDataUrl, compressImage } from "./utils";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Few left",
  out_of_stock: "Out of stock",
};

export type ColourOption = { name: string; hex: string; images: string[]; available: boolean };

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  category: string;
  description: string;
  sizes: string[];
  images: string[];
  colours: ColourOption[];
  status: StockStatus;
  createdAt: string;
};
export type ProductInput = Omit<Product, "id" | "createdAt"> & { id?: string };

export type VisitRequest = {
  id: string;
  productId: string;
  productName: string;
  size: string;
  colour: string;
  customerName: string;
  mobile: string;
  status: "new" | "seen";
  createdAt: string;
};

export const isCloud = supabase !== null;

/* ---------- row mapping (Supabase) ---------- */
type ProductRow = {
  id: string; name: string; price: number; mrp: number | null; category: string;
  description: string | null; sizes: string[] | null; images: string[] | null;
  stock_status: StockStatus; colours: ColourOption[] | null; created_at: string;
};
type VisitRow = {
  id: string; product_id: string | null; product_name: string; size: string; colour: string | null;
  customer_name: string; mobile: string; status: "new" | "seen"; created_at: string;
};
const fromProduct = (r: ProductRow): Product => ({
  id: r.id, name: r.name, price: Number(r.price), mrp: r.mrp == null ? null : Number(r.mrp),
  category: r.category, description: r.description ?? "", sizes: r.sizes ?? [], images: r.images ?? [],
  colours: r.colours ?? [], status: r.stock_status, createdAt: r.created_at,
});
const fromVisit = (r: VisitRow): VisitRequest => ({
  id: r.id, productId: r.product_id ?? "", productName: r.product_name, size: r.size, colour: r.colour ?? "",
  customerName: r.customer_name, mobile: r.mobile, status: r.status, createdAt: r.created_at,
});

/* ---------- local (demo) storage ---------- */
const LP = "denim.products.v2";
const LV = "denim.visits.v2";
const LA = "denim.admin";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Browser storage is full. Remove some products or photos, or connect Supabase.");
  }
}


const channel = () => (typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("denim-visits") : null);

/* ---------- products ---------- */
export async function listProducts(): Promise<Product[]> {
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(fromProduct);
  }
  return readLocal<Product[]>(LP, []);
}

export async function saveProduct(p: ProductInput): Promise<void> {
  if (supabase) {
    const row = {
      name: p.name, price: p.price, mrp: p.mrp, category: p.category, description: p.description,
      sizes: p.sizes, images: p.images, colours: p.colours, stock_status: p.status,
    };
    const { error } = p.id
      ? await supabase.from("products").update(row).eq("id", p.id)
      : await supabase.from("products").insert(row);
    if (error) throw new Error(error.message);
    return;
  }
  const all = readLocal<Product[]>(LP, []);
  if (p.id) {
    writeLocal(LP, all.map((x) => (x.id === p.id ? { ...x, ...p, id: x.id } : x)));
  } else {
    writeLocal(LP, [{ ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...all]);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LP, readLocal<Product[]>(LP, []).filter((x) => x.id !== id));
}

export async function setStockStatus(id: string, status: StockStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("products").update({ stock_status: status }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LP, readLocal<Product[]>(LP, []).map((x) => (x.id === id ? { ...x, status } : x)));
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  if (supabase) {
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("products").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw new Error(error.message);
    return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
  }
  return blobToDataUrl(blob);
}

/* ---------- visit requests ---------- */
export async function createVisit(v: Omit<VisitRequest, "id" | "status" | "createdAt">): Promise<string> {
  const full: VisitRequest = { ...v, id: crypto.randomUUID(), status: "new", createdAt: new Date().toISOString() };
  if (supabase) {
    const { error } = await supabase.from("visit_requests").insert({
      id: full.id, product_id: v.productId || null, product_name: v.productName, size: v.size, colour: v.colour,
      customer_name: v.customerName, mobile: v.mobile,
    });
    if (error) throw new Error(error.message);
    // ask the server to push a notification to the shop owner's phone (does not block or fail the customer)
    void supabase.functions.invoke("notify-admin", { body: { visit_id: full.id } }).catch(() => undefined);
    return full.id;
  }
  writeLocal(LV, [full, ...readLocal<VisitRequest[]>(LV, [])]);
  const bc = channel();
  bc?.postMessage(full);
  bc?.close();
  return full.id;
}

export async function listVisits(): Promise<VisitRequest[]> {
  if (supabase) {
    const { data, error } = await supabase.from("visit_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as VisitRow[]).map(fromVisit);
  }
  return readLocal<VisitRequest[]>(LV, []);
}

export async function markVisitSeen(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("visit_requests").update({ status: "seen" }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LV, readLocal<VisitRequest[]>(LV, []).map((x) => (x.id === id ? { ...x, status: "seen" } : x)));
}

export async function deleteVisit(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("visit_requests").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LV, readLocal<VisitRequest[]>(LV, []).filter((x) => x.id !== id));
}

/* live updates for the admin: fires when a customer sends a visit request */
export function subscribeVisits(cb: (v: VisitRequest) => void): () => void {
  const sb = supabase;
  if (sb) {
    const ch = sb
      .channel("visit-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visit_requests" },
        (payload) => cb(fromVisit(payload.new as VisitRow)))
      .subscribe();
    return () => { void sb.removeChannel(ch); };
  }
  const bc = channel();
  if (bc) bc.onmessage = (e) => cb(e.data as VisitRequest);
  return () => bc?.close();
}

/* ---------- admin auth ---------- */
/* An admin is a login that exists in the SQL "admins" table (see supabase/schema.sql). */
async function cloudIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export async function isAdminSession(): Promise<boolean> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session !== null && (await cloudIsAdmin());
  }
  return sessionStorage.getItem(LA) === "1";
}

export async function adminSignIn(idOrEmail: string, secret: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: idOrEmail, password: secret });
    if (error) throw new Error(error.message);
    if (!(await cloudIsAdmin())) {
      await supabase.auth.signOut();
      throw new Error("This account is not an admin.");
    }
    return;
  }
  if (secret !== DEMO_ADMIN_PASSCODE) throw new Error("Wrong passcode");
  sessionStorage.setItem(LA, "1");
}

export async function adminSignOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  sessionStorage.removeItem(LA);
}

/* ---------- push subscriptions (admin devices) ---------- */
export async function savePushSubscription(sub: PushSubscriptionJSON): Promise<void> {
  if (!supabase || !sub.endpoint || !sub.keys) return;
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
}

/* ---------- customer push subscriptions (kept separate from the admin devices) ---------- */
export async function saveCustomerPush(sub: PushSubscriptionJSON): Promise<void> {
  if (!supabase || !sub.endpoint || !sub.keys) return;
  const { error } = await supabase
    .from("customer_push_subscriptions")
    .insert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
  if (error && error.code !== "23505") throw new Error(error.message);
}

/* ---------- customer accounts (email + Google) ---------- */
export type Customer = { id: string; email: string; name: string };

const toCustomer = (u: User): Customer => {
  const meta = u.user_metadata as { full_name?: string; name?: string };
  const email = u.email ?? "";
  return { id: u.id, email, name: meta.full_name || meta.name || email.split("@")[0] };
};

export async function getCustomer(): Promise<Customer | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? toCustomer(data.session.user) : null;
}

export function onAuthChange(cb: () => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}

/* returns "confirm" when the customer must first click the link sent to their email */
export async function customerSignUp(name: string, email: string, password: string): Promise<"done" | "confirm"> {
  if (!supabase) throw new Error("Login is not available right now");
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
  if (data.user && data.user.identities?.length === 0) throw new Error("This email is already registered. Please login.");
  return data.session ? "done" : "confirm";
}

export async function customerSignIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Login is not available right now");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function customerGoogle(): Promise<void> {
  if (!supabase) throw new Error("Login is not available right now");
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  if (error) throw new Error(error.message);
}

export async function customerSignOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
