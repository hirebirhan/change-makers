// Change Makers — Service Worker
// Strategy summary:
//   /_next/static/*   → CacheFirst   (content-hashed bundles, safe)
//   /_next/image, YouTube CDNs → StaleWhileRevalidate (thumbnails, not data)
//   /api/*            → NetworkFirst (fresh data, 10 s timeout)
//   navigations       → NetworkFirst (fresh pages, 10 s timeout; offline fallback)
//   everything else   → NetworkFirst

const VERSION = "v1";
const CACHES = {
  static: `static-${VERSION}`,
  pages: `pages-${VERSION}`,
  api: `api-${VERSION}`,
  images: `images-${VERSION}`,
};

const KNOWN_CACHES = Object.values(CACHES);
const OFFLINE_URL = "/offline";
const NETWORK_TIMEOUT_MS = 10_000;

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHES.static)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !KNOWN_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET over http(s)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // Content-hashed Next.js bundles → CacheFirst (no staleness risk)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, CACHES.static));
    return;
  }

  // Next.js image optimiser + YouTube CDNs → StaleWhileRevalidate
  if (
    url.pathname.startsWith("/_next/image") ||
    /^(yt3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)$/.test(url.hostname)
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHES.images));
    return;
  }

  // API routes → NetworkFirst (never serve stale analytics data)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, CACHES.api));
    return;
  }

  // All navigations → NetworkFirst with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, CACHES.pages).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // Everything else → NetworkFirst
  event.respondWith(networkFirst(request, CACHES.pages));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function networkFirst(request, cacheName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("Network failed and no cached response available");
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const revalidate = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached ?? revalidate;
}
