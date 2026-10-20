// Sends a push notification to every customer device when the admin lists a NEW product.
// Only a logged-in admin can trigger it, and the text always comes from the database.
// Deploy:  supabase functions deploy notify-customers      (keep "Verify JWT" ON - do NOT use --no-verify-jwt)
// Secrets: uses the same VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT as notify-admin
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { product_id } = await req.json();
    if (typeof product_id !== "string") return reply({ error: "product_id required" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;

    // 1) caller must be a logged-in admin
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (isAdmin !== true) return reply({ error: "Admins only" }, 403);

    // 2) product must exist and be freshly added (stops old products being re-announced)
    const sb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: p } = await sb.from("products").select("name, price, category, stock_status, created_at").eq("id", product_id).maybeSingle();
    if (!p) return reply({ ok: true, skipped: "not found" });
    if (Date.now() - new Date(p.created_at).getTime() > 30 * 60 * 1000) return reply({ ok: true, skipped: "not new" });
    if (p.stock_status === "out_of_stock") return reply({ ok: true, skipped: "out of stock" });

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!
    );
    const { data: subs } = await sb.from("customer_push_subscriptions").select("*");
    const payload = JSON.stringify({
      title: "New at Denim BSL",
      body: `${p.name} - Rs ${p.price}. Come and see it in the shop!`,
      url: "/#products",
      tag: `denim-new-${product_id}`,
    });

    let sent = 0;
    const errors: string[] = [];
    const list = subs ?? [];
    if (!list.length) console.error("no customer devices in customer_push_subscriptions");
    for (let i = 0; i < list.length; i += 50) {
      await Promise.all(list.slice(i, i + 50).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          sent++;
        } catch (e) {
          const err = e as { statusCode?: number; body?: string; message?: string };
          const msg = `push failed: ${err.statusCode ?? ""} ${err.body ?? err.message ?? ""}`.slice(0, 300);
          console.error(msg);
          if (errors.length < 5) errors.push(msg);
          if (err.statusCode === 404 || err.statusCode === 410) await sb.from("customer_push_subscriptions").delete().eq("id", s.id);
        }
      }));
    }
    return reply({ ok: true, sent, total: list.length, errors });
  } catch (e) {
    console.error("notify-customers failed:", e);
    return reply({ error: String(e) }, 500);
  }
});
