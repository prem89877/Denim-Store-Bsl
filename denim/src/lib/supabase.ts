import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/* null => demo mode (data stays in this browser only).
   pkce: login links and Google login come back with ?code=... (keeps the #/admin route working) */
export const supabase = url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
