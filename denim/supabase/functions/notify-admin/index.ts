// Sends a push notification to every registered admin device when a customer confirms a shop visit.
// Deploy:  supabase functions deploy notify-admin
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
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
    const { visit_id } = await req.json();
    if (typeof visit_id !== "string") return reply({ error: "visit_id required" }, 400);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // claim the request so one visit can only ever notify once; the message text always comes from the database
    const { data: claimed } = await sb
      .from("visit_requests").update({ notified: true })
      .eq("id", visit_id).eq("notified", false).select("*");
    const v = claimed?.[0];
    if (!v) return reply({ ok: true, skipped: true });

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!
    );
    const { data: subs } = await sb.from("push_subscriptions").select("*");
    const payload = JSON.stringify({
      title: "New shop visit request",
      body: `${v.customer_name} (${v.mobile}) - ${v.product_name}${v.colour ? ", " + v.colour : ""}, size ${v.size}`,
      url: "/#/admin",
    });

    let sent = 0;
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from("push_subscriptions").delete().eq("id", s.id);
      }
    }));
    return reply({ ok: true, sent });
  } catch (e) {
    return reply({ error: String(e) }, 500);
  }
});
