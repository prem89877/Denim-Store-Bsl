# Denim showcase website + PWA

Product showcase (not an online store). Customers pick a product and size, tap **Visit shop**, enter name and mobile, and the admin gets a notification.

## Run
    npm install
    npm run dev      # local preview
    npm run build    # production build (serve over HTTPS so the PWA can install)

## Edit shop details
`src/config.ts` has phone, address, map link, WhatsApp number, categories and size list.

## Admin panel
Open `/#/admin`.
- Demo mode (no Supabase keys): passcode is `DEMO_ADMIN_PASSCODE` in `src/config.ts` (default `denim123`). Data stays only in that browser.
- Live mode (real use): customers and admin are on different phones, so connect Supabase:
  1. Create a free project at supabase.com
  2. SQL Editor -> paste `supabase/schema.sql` -> Run
  3. Authentication -> Users -> Add user (admin email + password)
  4. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  5. Add the same two values in your hosting (Netlify/Vercel) environment settings

## Notifications
Admin opens `/#/admin`, taps "allow notifications". New visit requests then appear instantly (in-app alert + phone/system notification) while the admin app is open or in the background. Every request is also saved in the Visit requests list with customer name, mobile, product and size. Notifications when the app is fully closed need a push server, which is not included.

## PWA
Manifest, service worker and icons are in `public/`. Lion image is the app icon, DENIM wordmark is the header logo (`public/denim-logo.png`).
