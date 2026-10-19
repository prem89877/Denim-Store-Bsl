import { useEffect, useState } from "react";
import {
  MapPin, Phone, Menu, X, Award, Users, Heart, Star, Navigation, Clock, Download,
} from "lucide-react";
import ProductSection from "./components/ProductSection";
import Admin from "./components/Admin";
import { AccountMenu } from "./components/CustomerAuth";
import WelcomePrompt from "./components/WelcomePrompt";
import SupportChat from "./components/SupportChat";
import { isIOS, isStandalone, useInstallPrompt } from "./pwa";
import { PHONE, ADDRESS, MAPS } from "./config";

const stats = [
  { n: "25+", l: "Years in Bhusawal" },
  { n: "10,000+", l: "Happy customers" },
  { n: "500+", l: "Styles in store" },
  { n: "3", l: "Generations of trust" },
];

const journey = [
  { year: "1998", title: "A small shop begins", text: "Denim opens near Bhusawal Railway Station with one rack of jeans and a promise of honest prices." },
  { year: "2006", title: "The town starts to trust us", text: "Families return year after year. Word of mouth fills the shop." },
  { year: "2014", title: "A bigger store", text: "We grow our range to shirts, jackets and kids wear without losing the personal touch." },
  { year: "2024", title: "Denim today", text: "A trusted name for style and quality in Bhusawal, now with a new generation behind the counter." },
];

const values = [
  { icon: Award, title: "Quality we stand behind", text: "We check stitching, fabric and fit before anything is shelved." },
  { icon: Heart, title: "Fair, honest pricing", text: "Good denim should not cost a fortune. Our prices are clear and fair." },
  { icon: Users, title: "Service like family", text: "Our team knows regular customers by name and helps everyone find their fit." },
];

const nav = [["Products", "#products"], ["Our journey", "#journey"], ["Our legacy", "#legacy"], ["Visit us", "#visit"]];

function Rivet({ className = "" }: { className?: string }) {
  return <span className={`rivet inline-block h-3 w-3 rounded-full bg-rivet ${className}`} aria-hidden />;
}

function Site() {
  const [open, setOpen] = useState(false);
  const install = useInstallPrompt();
  const [iosTip, setIosTip] = useState(false);
  const showInstallIcon = install !== null || (isIOS() && !isStandalone());

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-denim-sky bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" aria-label="Denim home" className="flex items-center">
            <img src="/denim-logo.png" alt="Denim" className="h-9 w-auto md:h-10" />
          </a>
          <nav className="hidden gap-8 md:flex" aria-label="Main">
            {nav.map(([l, h]) => (
              <a key={h} href={h} className="font-medium text-denim hover:text-rivet">{l}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <AccountMenu />
            {install && (
              <button onClick={install} className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-4 py-2 font-medium hover:bg-denim-deep hover:text-white">
                <Download size={16} /> Install app
              </button>
            )}
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-5 py-2 font-medium text-white hover:bg-denim">
              <Phone size={16} /> Call us
            </a>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            {showInstallIcon && (
              <button onClick={() => (install ? install() : setIosTip((v) => !v))} aria-label="Install app" title="Install app"
                className="grid h-9 w-9 place-items-center rounded-full bg-denim-deep text-white hover:bg-denim">
                <Download size={18} />
              </button>
            )}
            <button onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {iosTip && (
          <p className="border-t border-denim-sky bg-denim-wash px-5 py-3 text-sm md:hidden">
            To install: tap the <b>Share</b> button in Safari, then choose <b>Add to Home Screen</b>.
          </p>
        )}
        {open && (
          <nav className="flex flex-col gap-1 border-t border-denim-sky bg-white px-5 py-3 md:hidden" aria-label="Mobile">
            {nav.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="py-2 font-medium text-denim">{l}</a>
            ))}
            <AccountMenu mobile />
            {install && (
              <button onClick={install} className="flex items-center gap-2 py-2 text-left font-medium text-denim"><Download size={16} /> Install app</button>
            )}
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="twill relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-5 md:py-28">
          <div className="hero-in md:col-span-3">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
              <Star size={14} className="text-stitch" /> Trusted by Bhusawal since 1998
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              Denim that<br />lives with you.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-denim-wash">
              Jeans, jackets and everyday wear, chosen with care and sold with honesty. Come in, try it on, and feel the difference.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href={MAPS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-stitch px-7 py-3 font-bold text-denim-deep hover:bg-white">
                <Navigation size={18} /> Get directions
              </a>
              <a href="#products" className="inline-flex items-center rounded-full border-2 border-white/60 px-7 py-3 font-bold hover:bg-white hover:text-denim-deep">
                Browse products
              </a>
            </div>
          </div>

          {/* the denim tag: hero's one memorable object */}
          <div className="hero-in md:col-span-2">
            <div className="seam relative mx-auto max-w-xs rotate-3 rounded-xl bg-white p-8 text-denim-deep shadow-2xl">
              <Rivet className="absolute left-4 top-4" />
              <Rivet className="absolute right-4 top-4" />
              <img src="/denim-logo.png" alt="Denim" className="mt-6 h-auto w-full" />
              <p className="mt-2 text-sm font-medium text-denim">Quality jeanswear</p>
              <div className="my-5 border-t-2 border-dashed border-denim-sky" />
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt>Fit</dt><dd className="font-bold">Made for you</dd></div>
                <div className="flex justify-between"><dt>Fabric</dt><dd className="font-bold">Built to last</dd></div>
                <div className="flex justify-between"><dt>Since</dt><dd className="font-bold">1998</dd></div>
              </dl>
              <span className="absolute -bottom-4 right-6 rounded bg-tag px-3 py-1 text-xs font-bold text-white">Bhusawal's favourite</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-denim-wash">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-4xl font-extrabold text-denim">{s.n}</p>
              <p className="mt-1 text-sm text-denim-deep">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <ProductSection />

      {/* JOURNEY (real sequence → timeline) */}
      <section id="journey" className="twill-deep text-white">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl">Our journey</h2>
          <p className="mt-3 max-w-xl text-denim-sky">From one rack of jeans to a name the town knows.</p>
          <ol className="mt-12 space-y-0 border-l-2 border-dashed border-stitch pl-8">
            {journey.map((j) => (
              <li key={j.year} className="relative pb-12 last:pb-0">
                <Rivet className="absolute -left-[41px] top-2 !h-4 !w-4" />
                <p className="font-display text-3xl font-extrabold text-stitch">{j.year}</p>
                <h3 className="mt-1 text-xl font-bold">{j.title}</h3>
                <p className="mt-1 max-w-xl text-denim-wash">{j.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LEGACY */}
      <section id="legacy" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-extrabold md:text-5xl">A legacy stitched with trust</h2>
            <p className="mt-5 text-lg text-denim">
              Denim began with a simple belief: everyone deserves clothes that fit well, last long and cost fairly. Today, grandparents, parents and children shop under one roof.
            </p>
            <p className="mt-4 text-denim">
              We are proud to be part of Bhusawal's daily life, from first jeans to wedding season. Every pair we sell carries our name, and we take that seriously.
            </p>
          </div>
          <div className="space-y-5">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl bg-denim-wash p-6">
                <span className="twill grid h-12 w-12 shrink-0 place-items-center rounded-full text-stitch"><Icon size={22} /></span>
                <div>
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-1 text-denim-deep/80">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section id="visit" className="bg-denim-wash">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-extrabold md:text-5xl">Come visit the store</h2>
            <p className="mt-4 flex gap-3 text-lg"><MapPin className="mt-1 shrink-0 text-rivet" />{ADDRESS}</p>
            <p className="mt-3 flex gap-3 text-lg"><Clock className="shrink-0 text-rivet" />Open every day, morning to night</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={MAPS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-7 py-3 font-bold text-white hover:bg-denim">
                <Navigation size={18} /> Navigate to shop
              </a>
              <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-7 py-3 font-bold hover:bg-denim-deep hover:text-white">
                <Phone size={18} /> {PHONE}
              </a>
            </div>
          </div>
          <a href={MAPS} target="_blank" rel="noreferrer" className="twill seam group relative grid h-64 place-items-center rounded-2xl text-white">
            <div className="text-center">
              <MapPin size={44} className="mx-auto text-stitch" />
              <p className="mt-3 font-display text-2xl font-bold">Open in Google Maps</p>
              <p className="text-sm text-denim-wash">Kanhaya Kunj, Bhusawal</p>
            </div>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="twill-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <img src="/denim-logo.png" alt="Denim" className="h-10 w-auto" />
            <p className="mt-2 text-denim-sky">Quality jeanswear for Bhusawal, since 1998.</p>
          </div>
          <div>
            <p className="font-bold text-stitch">Call us</p>
            <a href={`tel:${PHONE}`} className="mt-2 inline-flex items-center gap-2 hover:text-stitch"><Phone size={16} /> {PHONE}</a>
          </div>
          <div>
            <p className="font-bold text-stitch">Find us</p>
            <a href={MAPS} target="_blank" rel="noreferrer" className="mt-2 flex gap-2 hover:text-stitch"><MapPin size={16} className="mt-1 shrink-0" />{ADDRESS}</a>
          </div>
        </div>
      </footer>
      <WelcomePrompt />
      <SupportChat />
    </div>
  );
}

const isAdminRoute = () => window.location.hash.startsWith("#/admin");

export default function App() {
  const [admin, setAdmin] = useState(isAdminRoute());
  useEffect(() => {
    const on = () => setAdmin(isAdminRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return admin ? <Admin /> : <Site />;
}
