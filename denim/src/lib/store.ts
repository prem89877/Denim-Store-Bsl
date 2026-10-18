import { supabase } from "./supabase";
import { DEMO_ADMIN_PASSCODE } from "../config";
import { blobToDataUrl, compressImage } from "./utils";

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  category: string;
  description: string;
  sizes: string[];
  images: string[];
  inStock: boolean;
  createdAt: string;
};
export type ProductInput = Omit<Product, "id" | "createdAt"> & { id?: string };

export type VisitRequest = {
  id: string;
  productId: string;
  productName: string;
  size: string;
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
  in_stock: boolean; created_at: string;
};
type VisitRow = {
  id: string; product_id: string | null; product_name: string; size: string;
  customer_name: string; mobile: string; status: "new" | "seen"; created_at: string;
};
const fromProduct = (r: ProductRow): Product => ({
  id: r.id, name: r.name, price: Number(r.price), mrp: r.mrp == null ? null : Number(r.mrp),
  category: r.category, description: r.description ?? "", sizes: r.sizes ?? [], images: r.images ?? [],
  inStock: r.in_stock, createdAt: r.created_at,
});
const fromVisit = (r: VisitRow): VisitRequest => ({
  id: r.id, productId: r.product_id ?? "", productName: r.product_name, size: r.size,
  customerName: r.customer_name, mobile: r.mobile, status: r.status, createdAt: r.created_at,
});

/* ---------- local (demo) storage ---------- */
const LP = "denim.products.v1";
const LV = "denim.visits.v1";
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

const SEED: Product[] = [
  { id: "demo-1", name: "Classic Straight Jeans", price: 1299, mrp: 1599, category: "Jeans",
    description: "Mid-rise straight fit in durable mid-blue denim.", sizes: ["30", "32", "34", "36"],
    images: [], inStock: true, createdAt: new Date().toISOString() },
  { id: "demo-2", name: "Washed Trucker Jacket", price: 1899, mrp: null, category: "Jackets",
    description: "Washed denim jacket with metal buttons.", sizes: ["M", "L", "XL"],
    images: [], inStock: true, createdAt: new Date().toISOString() },
  { id: "demo-3", name: "Kids Stretch Jeans", price: 799, mrp: 999, category: "Kids wear",
    description: "Soft stretch denim for everyday play.", sizes: ["S", "M", "L"],
    images: [], inStock: true, createdAt: new Date().toISOString() },
];

const channel = () => (typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("denim-visits") : null);

/* ---------- products ---------- */
export async function listProducts(): Promise<Product[]> {
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(fromProduct);
  }
  const existing = localStorage.getItem(LP);
  if (existing === null) writeLocal(LP, SEED);
  return readLocal<Product[]>(LP, SEED);
}

export async function saveProduct(p: ProductInput): Promise<void> {
  if (supabase) {
    const row = {
      name: p.name, price: p.price, mrp: p.mrp, category: p.category, description: p.description,
      sizes: p.sizes, images: p.images, in_stock: p.inStock,
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
export async function createVisit(v: Omit<VisitRequest, "id" | "status" | "createdAt">): Promise<void> {
  const full: VisitRequest = { ...v, id: crypto.randomUUID(), status: "new", createdAt: new Date().toISOString() };
  if (supabase) {
    const { error } = await supabase.from("visit_requests").insert({
      id: full.id, product_id: v.productId || null, product_name: v.productName, size: v.size,
      customer_name: v.customerName, mobile: v.mobile,
    });
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LV, [full, ...readLocal<VisitRequest[]>(LV, [])]);
  const bc = channel();
  bc?.postMessage(full);
  bc?.close();
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
export async function isAdminSession(): Promise<boolean> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session !== null;
  }
  return sessionStorage.getItem(LA) === "1";
}

export async function adminSignIn(idOrEmail: string, secret: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: idOrEmail, password: secret });
    if (error) throw new Error(error.message);
    return;
  }
  if (secret !== DEMO_ADMIN_PASSCODE) throw new Error("Wrong passcode");
  sessionStorage.setItem(LA, "1");
}

export async function adminSignOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  sessionStorage.removeItem(LA);
}
