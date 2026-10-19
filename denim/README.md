# Denim showcase website + PWA

Product showcase (not an online store). Customer picks a product, colour and size, taps **Visit shop**, enters name + mobile, taps **Confirm shop visit**, and the shop owner gets a notification.

## Run
    npm install
    npm run dev      # local preview
    npm run build    # production build (serve over HTTPS so the PWA and notifications work)

Shop details (phone, address, map, categories, sizes, colour presets): `src/config.ts`

## Admin panel: `/#/admin`
Admins exist only in the database; there is no sign-up on the website.

### One-time setup (Supabase)
1. Create a project at supabase.com. Keep "Allow new users to sign up" ON (customers sign up on the website; they are never admins unless you run `make_admin` in SQL).
2. SQL Editor -> paste `supabase/schema.sql` -> Run (safe to run again).
3. Copy `.env.example` to `.env`, fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings -> API). Add the same values in Netlify/Vercel environment settings.

### Make / remove admins (SQL Editor)
    select create_admin('owner@example.com', 'StrongPassword123');   -- new admin login
    select make_admin('existing.user@example.com');                  -- existing Supabase user becomes admin
    select remove_admin('owner@example.com');                        -- remove admin rights
Only a logged-in user listed in the `admins` table can add/edit products, see visit requests or upload photos. Anyone else is blocked by the database itself.

### Products
Each product: name, price, old price, category, stock status (In stock / Few left / Out of stock), sizes, details, 1 to 5 photos, and colour options. Each colour has its own name, swatch, "available" switch and up to 5 photos. Stock status can also be changed quickly from the product list. Optional **price by size** and **price by colour** can be set (empty = main price). If both apply, the size price wins, then the colour price, then the main price. Run `supabase/schema.sql` again once to add the `size_prices` column.

## Customer login (email + Google)
The website header has "Login / Sign up" (only when Supabase is connected). Customers log in with email + password or Google. Their name is filled in automatically when they confirm a shop visit. Logging in is optional.

Supabase setup:
1. Authentication -> URL Configuration: set **Site URL** to your Vercel URL and add it under **Redirect URLs**.
2. Google: Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth client ID (Web application). Add authorized redirect URI `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`. Then Supabase -> Authentication -> Providers -> Google: enable and paste Client ID + Client Secret.
3. Email signups send a confirmation mail. Supabase's built-in mail sender is limited to a few emails per hour; for real traffic add your own SMTP (Authentication -> Emails -> SMTP) or turn off "Confirm email".

Make an admin the easy way: sign up on the website with the owner's email, then run `select make_admin('owner@example.com');` and login at `/#/admin`.

## First visit prompt + app name
A first-time visitor sees a small "Welcome to Denim BSL" card with **Install app** and **Enable notifications** (shown once; iPhone users get the "Add to Home Screen" steps). The installed app is named **Denim BSL** (`public/manifest.webmanifest`). Customer devices that allow notifications are saved in `customer_push_subscriptions` (separate from admin devices). Sending shop updates to customers is not built yet.

## Phone notifications (shop owner)
When a customer confirms a visit, the request is saved and a server function pushes a notification (customer name, mobile, product, colour, size) to every admin device.

1. Generate keys: `npx web-push generate-vapid-keys`
2. Put the public key in `.env` as `VITE_VAPID_PUBLIC_KEY` (and in hosting settings)
3. Install the Supabase CLI, then:
       supabase login
       supabase link --project-ref YOUR_PROJECT_REF
       supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
       supabase functions deploy notify-admin
4. Deploy the website, open `/#/admin` on the owner's phone, log in, tap "turn on notifications" and allow.
   - Android: works in Chrome, also when the app is closed.
   - iPhone: first Add to Home Screen (install the PWA), open it from there, then enable notifications (iOS 16.4+).

Without steps 1-3 the admin still sees new requests live inside the open app and in the Visit requests list.

## Demo mode
With no Supabase keys the site runs in demo mode (data in this browser only, admin passcode `DEMO_ADMIN_PASSCODE` in `src/config.ts`, default `denim123`). No push in demo mode.
