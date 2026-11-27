// MIMIN ERP Service Worker
// Handles: caching, offline, push notifications

const CACHE_NAME = "mimin-erp-v1795789602181";
const VAPID_PUBLIC_KEY = "BLc4xRzKlKORKG0LZ4W3c-OMmFhbS3rRnZYzLgJs1aL9MVp1EihP4o2jAgMTxb5-B6h0QFyTbApdRRG3eFcALXs";

// Static assets to pre-cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-96.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event handler: An toàn tuyệt đối, không can thiệp API & không trả về HTML cho JS chunks
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. TUYỆT ĐỐI KHÔNG can thiệp vào request cross-origin (như Supabase, Google Fonts, v.v.)
  if (url.origin !== self.location.origin) return;

  // 2. Không can thiệp các file nhạy cảm: version.json, sw.js, API routes
  if (
    url.pathname.endsWith("version.json") ||
    url.pathname.endsWith("sw.js") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 3. Với các file tĩnh hình ảnh/icon: Cache-first
  const isStaticFile =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json";

  if (isStaticFile) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 4. Với JS / CSS chunks của Next.js: Network-first KHÔNG BAO GIỜ fallback về HTML "/"
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 5. Với HTML Navigation (khi người dùng mở trang mà mất mạng hoàn toàn):
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/").then((cached) => cached || Response.error())
      )
    );
    return;
  }
});

// ============ PUSH NOTIFICATION HANDLERS ============

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "MIMIN ERP", body: event.data.text() };
  }
  const { title, body, icon, badge, tag, data, actions, requireInteraction } = payload;
  const options = {
    body: body || "",
    icon: icon || "/icons/icon-192.png",
    badge: badge || "/icons/badge-96.png",
    tag: tag || "mimin-default",
    data: data || {},
    actions: actions || [],
    requireInteraction: !!requireInteraction,
    vibrate: [200, 100, 200, 100, 200],
    dir: "ltr",
  };
  event.waitUntil(self.registration.showNotification(title || "MIMIN ERP", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
