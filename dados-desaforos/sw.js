/* One complete release offline; navigations check the network first. */
const RELEASE = '5.11.0';
const VERSION = 'elarion-v5.11.0-vercel-living';
const OWN_CACHE = /^elarion-v[\d.]+-(?:vercel-)?living$/;
const ROOT = self.registration.scope;
const absolute = path => new URL(path, ROOT).href;
const INDEX = absolute('index.html');
const releaseOf = html => (html.match(/<meta\s+[^>]*name=["']elarion-release["'][^>]*content=["']([^"']+)/i) || [])[1];
const assetUrls = (text, base, css = false) => [...text.matchAll(css ? /url\(\s*["']?([^\s"')]+)["']?\s*\)/g : /(?:src|href)=["']([^"']+)["']/g)]
  .map(m => { try { return new URL(m[1], base); } catch { return null; } })
  .filter(u => u && u.origin === self.location.origin && /\/(?:js|css|vendor|icons|fonts)\//.test(u.pathname))
  .map(u => u.href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Do not overwrite a release cache before every required file arrived.
    const fetched = new Map();
    const get = async url => {
      if (fetched.has(url)) return fetched.get(url);
      const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
      if (!response.ok || response.type === 'opaque') throw new Error('Incomplete Elarion release: ' + url);
      const body = await response.arrayBuffer(), headers = new Headers(response.headers);
      for (const key of ['content-encoding', 'content-length', 'transfer-encoding']) headers.delete(key);
      const complete = new Response(body, { status: response.status, statusText: response.statusText, headers });
      fetched.set(url, complete);return complete;
    };
    const index = await get(INDEX), html = await index.clone().text();
    if (releaseOf(html) !== RELEASE) throw new Error('Elarion HTML and worker versions differ.');
    const assets = [...new Set(assetUrls(html, INDEX))];
    if (!assets.some(u => /\/js\/main\.js(?:\?|$)/.test(u))) throw new Error('Elarion entry module missing.');
    for (let i = 0; i < assets.length; i += 8) await Promise.all(assets.slice(i, i + 8).map(get));
    const fonts = new Set();
    for (const [url, response] of fetched) if (/\.css(?:\?|$)/.test(url)) for (const dependency of assetUrls(await response.clone().text(), url, true)) fonts.add(dependency);
    await Promise.all([...fonts].map(get));
    for (const path of ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png']) { try { await get(absolute(path)); } catch { /* optional app icon */ } }
    const cache = await caches.open(VERSION);
    await Promise.all([...fetched].map(([url, response]) => cache.put(url, response.clone())));
    await cache.put(absolute('./'), index.clone());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Existing tabs can finish a game with their previous release's assets.
    const own = (await caches.keys()).filter(key => OWN_CACHE.test(key) && key !== VERSION);
    await Promise.all(own.slice(0, Math.max(0, own.length - 2)).map(key => caches.delete(key)));
    await self.clients.claim();
    for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) client.postMessage({ type: 'ELARION_RELEASE_READY', release: RELEASE });
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ELARION_GET_RELEASE' && event.ports[0]) event.ports[0].postMessage({ release: RELEASE });
  if (event.data && event.data.type === 'ELARION_ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || /^\/(?:api(?:\/|$)|ws(?:\/|$)|downloads(?:\/|$))/.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch(new Request(request, { cache: 'no-store' }));
        if (!response.ok) throw new Error('Navigation unavailable');
        // Never store a future deployment's HTML in this release's cache.
        if (/text\/html/i.test(response.headers.get('content-type') || '') && releaseOf(await response.clone().text()) === RELEASE) await cache.put(request, response.clone());
        return response;
      } catch { return await cache.match(request) || await cache.match(INDEX) || Response.error(); }
    })());return;
  }
  if (!/\/(?:js|css|vendor|icons|fonts)\//.test(url.pathname) && !url.pathname.endsWith('/manifest.webmanifest')) return;
  event.respondWith((async () => {
    const current = await caches.open(VERSION), hit = await current.match(request);if (hit) return hit;
    // Compare exact URLs, including ?v=. Never substitute another release.
    const requestedRelease = (url.pathname.match(/\/releases\/([^/]+)\//) || [])[1] || url.searchParams.get('v');
    if (requestedRelease && requestedRelease !== RELEASE) for (const key of (await caches.keys()).filter(key => OWN_CACHE.test(key) && key !== VERSION).reverse()) {
      const old = await (await caches.open(key)).match(request);if (old) return old;
    }
    try { return await fetch(request); } catch { return Response.error(); }
  })());
});
