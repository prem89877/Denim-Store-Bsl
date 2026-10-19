import { useEffect, useRef, useState } from "react";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

/* The white square on /qr-card.jpg (784 x 1168). The QR is drawn centred inside it. */
const CARD = { w: 784, h: 1168, cx: 392, cy: 614, size: 440 };
const SCALE = 2; // export at 2x so the QR stays sharp when printed
const INK = "#14284B";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the QR card image"));
    img.src = src;
  });
}

async function qrImage(text: string, px: number): Promise<HTMLImageElement> {
  const url = await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M", margin: 0, width: px, color: { dark: INK, light: "#FFFFFF" },
  });
  return loadImage(url);
}

function download(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "image/png");
}

export default function QrCard() {
  const [url, setUrl] = useState(window.location.origin);
  const [err, setErr] = useState("");
  const cardRef = useRef<HTMLCanvasElement>(null);
  const plainRef = useRef<HTMLCanvasElement>(null);

  const valid = /^https?:\/\/.+\..+|^https?:\/\/localhost/i.test(url.trim());

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    (async () => {
      try {
        const [bg, qr] = await Promise.all([loadImage("/qr-card.jpg"), qrImage(url.trim(), CARD.size * SCALE)]);
        if (!alive) return;

        const card = cardRef.current!;
        card.width = CARD.w * SCALE;
        card.height = CARD.h * SCALE;
        const c = card.getContext("2d")!;
        c.drawImage(bg, 0, 0, card.width, card.height);
        c.drawImage(qr, (CARD.cx - CARD.size / 2) * SCALE, (CARD.cy - CARD.size / 2) * SCALE, CARD.size * SCALE, CARD.size * SCALE);

        const plain = plainRef.current!;
        const pad = 60;
        plain.width = plain.height = CARD.size * SCALE + pad * 2;
        const p = plain.getContext("2d")!;
        p.fillStyle = "#FFFFFF";
        p.fillRect(0, 0, plain.width, plain.height);
        p.drawImage(qr, pad, pad);
        setErr("");
      } catch (ex) {
        if (alive) setErr(ex instanceof Error ? ex.message : "Could not create QR code");
      }
    })();
    return () => { alive = false; };
  }, [url, valid]);

  return (
    <div className="mt-5 rounded-2xl bg-white p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><QrCode size={20} /> Customer QR code</h2>
      <p className="mt-1 text-sm text-denim-deep/70">
        Customer ye QR scan karega to seedha Denim website khulegi. Print karke shop mein laga sakte ho.
      </p>

      <label className="mt-4 block text-sm font-medium">Website link (QR scan karne par yahi khulega)
        <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoCapitalize="off" spellCheck={false}
          className="mt-1 w-full rounded-lg border-2 border-denim-sky bg-white px-3 py-2.5" />
      </label>
      {!valid && <p role="alert" className="mt-2 text-sm font-medium text-tag">Valid link daalo, jaise https://yoursite.com</p>}
      {url.includes("localhost") && <p className="mt-2 text-sm text-tag">Ye localhost link hai, sirf aapke computer pe chalega. Live website ka link daalo.</p>}
      {err && <p role="alert" className="mt-2 text-sm font-medium text-tag">{err}</p>}

      <div className={valid ? "" : "hidden"}>
        <canvas ref={cardRef} aria-label="QR card preview" className="mx-auto mt-5 h-auto w-full max-w-xs rounded-xl shadow-lg" />
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => cardRef.current && download(cardRef.current, "denim-qr-card.png")}
            className="inline-flex items-center gap-2 rounded-full bg-denim-deep px-6 py-3 font-bold text-white hover:bg-denim">
            <Download size={18} /> Download QR card
          </button>
          <button onClick={() => plainRef.current && download(plainRef.current, "denim-qr.png")}
            className="inline-flex items-center gap-2 rounded-full border-2 border-denim-deep px-6 py-3 font-bold hover:bg-denim-deep hover:text-white">
            <Download size={18} /> Only QR (white background)
          </button>
        </div>
        <canvas ref={plainRef} className="hidden" />
      </div>
    </div>
  );
}
