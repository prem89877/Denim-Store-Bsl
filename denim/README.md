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
1. Create a project at supabase.com. Authentication -> Providers -> Email: turn OFF "Allow new users to sign up".
2. SQL Editor -> paste `supabase/schema.sql` -> Run (safe to run again).
3. Copy `.env.example` to `.env`, fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings -> API). Add the same values in Netlify/Vercel environment settings.

### Make / remove admins (SQL Editor)
    select create_admin('owner@example.com', 'StrongPassword123');   -- new admin login
    select make_admin('existing.user@example.com');                  -- existing Supabase user becomes admin
    select remove_admin('owner@example.com');                        -- remove admin rights
Only a logged-in user listed in the `admins` table can add/edit products, see visit requests or upload photos. Anyone else is blocked by the database itself.

### Products
Each product: name, price, old price, category, stock status (In stock / Few left / Out of stock), sizes, details, 1 to 5 photos, and colour options. Each colour has its own name, swatch, "available" switch and up to 5 photos. Stock status can also be changed quickly from the product list.

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
