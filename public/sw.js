/* PayPal app service worker: keeps payment notifications in the status bar. */

const STORE_CACHE = "pp-notifications-v1";
const STORE_URL = "/__pp-notifications";

async function readStore() {
  try {
    const cache = await caches.open(STORE_CACHE);
    const res = await cache.match(STORE_URL);
    if (!res) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function writeStore(list) {
  const cache = await caches.open(STORE_CACHE);
  await cache.put(
    STORE_URL,
    new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } })
  );
}

async function saveNotification(payload) {
  const list = await readStore();
  const next = list.filter((n) => n.tag !== payload.tag);
  next.push(payload);
  await writeStore(next.slice(-20));
}

async function showNotification(payload) {
  /* Use the message as the title so the tray shows only "PayPal" + the message,
     with no extra "from PayPal" line underneath. */
  await self.registration.showNotification(payload.body || payload.title, {
    tag: payload.tag,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    requireInteraction: true,
    renotify: false,
    silent: false,
    data: payload,
  });
}

async function restoreAll() {
  const list = await readStore();
  const shown = await self.registration.getNotifications();
  const shownTags = new Set(shown.map((n) => n.tag));
  for (const payload of list) {
    if (!shownTags.has(payload.tag)) await showNotification(payload);
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim().then(restoreAll));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "pp-persist") {
    event.waitUntil(
      saveNotification({
        title: data.title || "PayPal",
        body: data.body || "",
        tag: data.tag || `pp-${Date.now()}`,
        url: data.url || "/",
      })
    );
  }
  if (data.type === "pp-notify") {
    const payload = {
      title: data.title || "PayPal",
      body: data.body || "",
      tag: data.tag || `pp-${Date.now()}`,
      url: data.url || "/",
    };
    event.waitUntil(saveNotification(payload).then(() => showNotification(payload)));
  }
  if (data.type === "pp-restore") {
    event.waitUntil(restoreAll());
  }
  if (data.type === "pp-clear") {
    event.waitUntil(
      (async () => {
        await writeStore([]);
        const shown = await self.registration.getNotifications();
        shown.forEach((n) => n.close());
      })()
    );
  }
});

/* Re-show the notification if the user swipes it away, so it stays in the status bar. */
self.addEventListener("notificationclose", (event) => {
  const payload = event.notification.data;
  if (!payload) return;
  event.waitUntil(
    (async () => {
      const list = await readStore();
      if (list.some((n) => n.tag === payload.tag)) await showNotification(payload);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  const payload = event.notification.data || {};
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = all[0];
      if (client) {
        await client.focus();
        if (payload.url) client.navigate(payload.url).catch(() => {});
      } else {
        await self.clients.openWindow(payload.url || "/");
      }
      /* keep it in the tray */
      if (payload.tag) await showNotification(payload);
    })()
  );
});
