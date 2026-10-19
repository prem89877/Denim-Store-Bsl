import { useEffect, useState } from "react";
import { BellRing, Download, Share, X } from "lucide-react";
import { askNotifyPermission, isIOS, isStandalone, pushSupported, subscribePush, useInstallPrompt } from "../pwa";
import { saveCustomerPush } from "../lib/store";

const KEY = "denim.welcome.v1";

/* shown once to a first-time visitor: install the app + allow shop notifications */
export default function WelcomePrompt() {
  const install = useInstallPrompt();
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const standalone = isStandalone();
  const ios = isIOS();
  const canInstall = !standalone && (install !== null || ios);
  const canNotify = perm === "default";
  if (!show || (!canInstall && !canNotify)) return null;

  const done = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  async function doInstall() {
    if (install) {
      await install();
      done();
    } else {
      setIosHelp(true);
    }
  }

  async function doNotify() {
    const r = await askNotifyPermission();
    setPerm(r);
    done();
    if (r === "granted" && pushSupported()) {
      // remember this device so the shop can send updates later
      subscribePush().then((sub) => (sub ? saveCustomerPush(sub) : undefined)).catch(() => undefined);
    }
  }

  return (
    <div role="dialog" aria-label="Install Denim BSL app"
      className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-md rounded-3xl border border-denim-sky bg-white p-5 shadow-2xl"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <button onClick={done} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1 hover:bg-denim-wash"><X size={18} /></button>
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
        <div>
          <p className="font-display text-lg font-extrabold leading-tight">Welcome to Denim BSL</p>
          <p className="text-sm text-denim-deep/70">Get the app and never miss shop updates.</p>
        </div>
      </div>

      {iosHelp ? (
        <p className="mt-4 rounded-xl bg-denim-wash p-3 text-sm">
          Tap the <Share size={14} className="inline -mt-0.5" /> <b>Share</b> button in Safari, then choose <b>Add to Home Screen</b>.
          Open Denim BSL from your home screen to turn on notifications.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {canInstall && (
            <button onClick={doInstall}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-denim-deep px-5 py-3 font-bold text-white hover:bg-denim">
              <Download size={16} /> Install app
            </button>
          )}
          {canNotify && (
            <button onClick={doNotify}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-stitch px-5 py-3 font-bold text-denim-deep hover:bg-denim-deep hover:text-white">
              <BellRing size={16} /> Enable notifications
            </button>
          )}
        </div>
      )}
      <button onClick={done} className="mt-3 w-full text-center text-sm font-medium text-denim-deep/60 hover:text-denim">Not now</button>
    </div>
  );
}
