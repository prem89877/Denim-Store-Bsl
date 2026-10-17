import { useState } from "react";
import {
  MapPin, Phone, Menu, X, Scissors, Ruler, Shirt, Baby, Watch, Award,
  Users, Heart, Star, Navigation, Sparkles, Clock,
} from "lucide-react";

/* ---------- EDIT YOUR CLIENT'S DETAILS HERE ---------- */
const PHONE = "9604627267";
const ADDRESS = "Railway Station Rd, Gandhi Nagar, Kanhaya Kunj, Bhusawal, Maharashtra 425201";
const MAPS = "https://maps.app.goo.gl/bSU9DcLPc1RsPQi4A";

const stats = [
  { n: "25+", l: "Years in Bhusawal" },
  { n: "10,000+", l: "Happy customers" },
  { n: "500+", l: "Styles in store" },
  { n: "3", l: "Generations of trust" },
];

const collections = [
  { icon: Ruler, title: "Jeans", text: "Slim, straight, relaxed and bootcut. Every fit is tried and checked before it reaches our shelf." },
  { icon: Shirt, title: "Shirts and tees", text: "Soft cotton and denim shirts that go from the office to the weekend." },
  { icon: Scissors, title: "Jackets", text: "Classic trucker and washed denim jackets built to last for years." },
  { icon: Baby, title: "Kids wear", text: "Tough, comfortable denim for children who never stop moving." },
  { icon: Watch, title: "Accessories", text: "Belts, wallets and caps to finish the look." },
  { icon: Sparkles, title: "Festive and wedding", text: "Smart collections for the season, ready when the occasion is." },
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

const nav = [["Collections", "#collections"], ["Our journey", "#journey"], ["Our legacy", "#legacy"], ["Visit us", "#visit"]];

function Rivet({ className = "" }: { className?: string }) {
  return <span className={`rivet inline-block h-3 w-3 rounded-full bg-rivet ${className}`} aria-hidden />;
}

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-denim-sky bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-denim-deep">
            <span className="twill grid h-9 w-9 place-items-center rounded-md text-white"><Rivet /></span>
            Denim
          </a>
          <nav className="hidden gap-8 md:flex" aria-label="Main">
            {nav.map(([l, h]) => (
              <a key={h} href={h} className="font-medium text-denim hover:text-rivet">{l}</a>
            ))}
          </nav>
          <a href={`tel:${PHONE}`} className="hidden items-center gap-2 rounded-full bg-denim-deep px-5 py-2 font-medium text-white hover:bg-denim md:inline-flex">
            <Phone size={16} /> Call us
          </a>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-denim-sky bg-white px-5 py-3 md:hidden" aria-label="Mobile">
            {nav.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="py-2 font-medium text-denim">{l}</a>
            ))}
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
              <a href="#collections" className="inline-flex items-center rounded-full border-2 border-white/60 px-7 py-3 font-bold hover:bg-white hover:text-denim-deep">
                See collections
              </a>
            </div>
          </div>

          {/* the denim tag: hero's one memorable object */}
          <div className="hero-in md:col-span-2">
            <div className="seam relative mx-auto max-w-xs rotate-3 rounded-xl bg-white p-8 text-denim-deep shadow-2xl">
              <Rivet className="absolute left-4 top-4" />
              <Rivet className="absolute right-4 top-4" />
              <p className="mt-4 font-display text-6xl font-extrabold leading-none">Denim</p>
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

      {/* COLLECTIONS */}
      <section id="collections" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-4xl font-extrabold md:text-5xl">What we bring to the rack</h2>
        <p className="mt-3 max-w-xl text-denim">A wide range for men, women and kids. Visit the store to see, touch and try every piece.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(({ icon: Icon, title, text }, i) => (
            <article key={title} className={`rounded-2xl p-7 ${i % 3 === 0 ? "twill text-white" : i % 3 === 1 ? "bg-denim-wash" : "seam bg-white"}`}>
              <Icon size={30} className={i % 3 === 0 ? "text-stitch" : "text-rivet"} />
              <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
              <p className={`mt-2 ${i % 3 === 0 ? "text-denim-wash" : "text-denim-deep/80"}`}>{text}</p>
            </article>
          ))}
        </div>
      </section>

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
            <p className="font-display text-3xl font-extrabold">Denim</p>
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
        <p className="border-t-2 border-dashed border-stitch/60 py-4 text-center text-sm text-denim-sky">© Denim. All rights reserved.</p>
      </footer>
    </div>
  );
}
