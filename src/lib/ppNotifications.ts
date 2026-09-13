/* Helpers for the persistent PayPal payment notification (status bar / tray). */

export async function registerPPServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "pp-restore" });
    return reg;
  } catch {
    return null;
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

    const reg = (await navigator.serviceWorker?.ready) ?? null;
    if (!reg) return false;
    (reg.active ?? navigator.serviceWorker.controller)?.postMessage({
      type: "pp-notify",
      title: opts.title,
      body: opts.body,
      tag: opts.tag,
      url: opts.url ?? "/",
    });
    return true;
  } catch {
    return false;
  }
}
