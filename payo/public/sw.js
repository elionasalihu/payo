/* Payo service worker (plain JavaScript, served from /sw.js).
 *
 * What it caches:
 *  - App pages (HTML): network first, cached copy when offline.
 *  - Next.js build files (/_next/static/*): cache first. Their file names contain
 *    a content hash, so a cached file never goes out of date.
 *  - Icons and other same-origin images: stale-while-revalidate.
 *
 * What it never caches:
 *  - Supabase API and auth requests (other origin): balances must be live and the
 *    responses contain private data. Without a connection those requests fail and
 *    the app shows an error; nothing is stored or queued offline.
 */

const VERSION = "payo-v1";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;

// Every static route of the app, cached at install time together with the
// JavaScript and CSS files each page references. These HTML files contain no
// user data: pages load the user's data from Supabase in the browser.
// (/client/groups/[groupId] is dynamic and is cached when a group is opened.)
const PRECACHE_PAGES = [
  "/", "/login", "/register", "/forgot-password", "/reset-password", "/privacy", "/terms", "/offline",
  "/client", "/client/expenses", "/client/groups", "/client/summary", "/client/activity", "/client/settings",
  "/admin", "/admin/users", "/admin/groups", "/admin/expenses",
];
const PRECACHE_ASSETS = ["/manifest.webmanifest", "/favicon.ico", "/logo192.png", "/logo512.png", "/apple-touch-icon.png"];

// Build files referenced by a page's HTML (<script src>, <link href>, preloads)
function buildFilesIn(html) {
  const files = new Set();
  for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) files.add(match[0]);
  return [...files];
}

async function precachePage(url, pages, statics) {
  const response = await fetch(new Request(url, { cache: "reload" }));
  if (!response.ok) return;
  await pages.put(new URL(url, self.location.origin).href, response.clone());
  const files = buildFilesIn(await response.text());
  await Promise.all(files.map((f) => statics.match(f).then((hit) => hit || statics.add(f)).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      const statics = await caches.open(STATIC);
      await Promise.all(PRECACHE_PAGES.map((url) => precachePage(url, pages, statics).catch(() => {})));
      const images = await caches.open(IMAGES);
      await images.addAll(PRECACHE_ASSETS).catch(() => {});
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Let the page activate a waiting update ("A new version of Payo is ready" -> Reload).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  const url = new URL(request.url);
  const key = url.origin + url.pathname; // ignore ?query so /client?source=pwa uses /client
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(key, response.clone());
    return response;
  } catch (error) {
    // Unknown URL (e.g. a group page never opened on this device): show the offline page.
    const cached = (await cache.match(key)) || (await cache.match(url.origin + "/offline"));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase and other origins: not handled

  // React Server Component payloads used for client-side navigation: always from the network.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (request.destination === "image" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(staleWhileRevalidate(request, IMAGES));
  }
});
