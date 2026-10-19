import { useEffect, useState } from "react";

export function registerSW() {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
  }
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function keyToBuffer(b64url: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const raw = atob((b64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(VAPID_PUBLIC_KEY);

/* subscribe this device to push (needs notification permission). Returns null when push is not available. */
export async function subscribePush(): Promise<PushSubscriptionJSON | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyToBuffer(VAPID_PUBLIC_KEY as string),
  }));
  return sub.toJSON();
}

export async function askNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

/* system notification (works while the admin app/tab is open or in the background) */
export async function notifyAdmin(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/favicon-32.png", tag: "denim-visit" });
      return;
    }
  } catch { /* fall through */ }
  new Notification(title, { body, icon: "/icon-192.png" });
}

type InstallEvent = Event & { prompt: () => Promise<void> };

/* returns an install function when the browser allows installing the app, else null */
export function useInstallPrompt(): (() => Promise<void>) | null {
  const [ev, setEv] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent); };
    const onInstalled = () => setEv(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return ev ? async () => { await ev.prompt(); setEv(null); } : null;
}
