/* Helpers for the persistent PayPal payment notification (status bar / tray). */

export async function registerPPServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const target = reg.active ?? navigator.serviceWorker.controller;
    target?.postMessage({ type: "pp-restore" });
    return reg;
  } catch {
    return null;
  }
}

/** Ask for notification permission. Must be called from a user gesture (tap). */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  try {
    // Make sure the worker exists before permission is granted.
    void registerPPServiceWorker();
    if (Notification.permission === "default") {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch {
    return "denied";
  }
}

export async function showPaymentNotification(opts: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  try {
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await registerPPServiceWorker();
    if (!reg) return false;

    const payload = {
      title: opts.title,
      body: opts.body,
      tag: opts.tag,
      url: opts.url ?? "/",
    };

    // Persist so the worker can re-show it after swipe-away / restart.
    (reg.active ?? navigator.serviceWorker.controller)?.postMessage({
      type: "pp-persist",
      ...payload,
    });

    // Show it straight from the page registration: this works even when the
    // service worker has only just been installed and isn't controlling yet.
    await reg.showNotification(payload.body || payload.title, {
      tag: payload.tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      requireInteraction: true,
      silent: false,
      data: payload,
    });
    return true;
  } catch {
    return false;
  }
}
