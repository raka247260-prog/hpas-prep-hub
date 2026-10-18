const CACHE_PREFIX = 'pahari-prep-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_ROOT = new URL('./', self.registration.scope);
const SHELL = [
  APP_ROOT.href,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('icon.svg', APP_ROOT).href,
  new URL('favicon.svg', APP_ROOT).href,
];
const APP_PAGES = new Set([
  APP_ROOT.pathname,
  ...['syllabus', 'study-room', 'pyq-library', 'mock-tests', 'current-affairs', 'my-library', 'performance']
    .map((path) => new URL(path, APP_ROOT).pathname),
]);

function isAppRequest(requestUrl) {
  if (requestUrl.origin !== self.location.origin) return false;
  if (APP_PAGES.has(requestUrl.pathname)) return true;
  if (requestUrl.pathname.startsWith(new URL('assets/', APP_ROOT).pathname)) return true;
  return SHELL.some((asset) => new URL(asset).pathname === requestUrl.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(SHELL.map(async (asset) => {
        try {
          const response = await fetch(asset);
          if (response.ok && response.type === 'basic') await cache.put(asset, response);
        } catch { /* Keep the worker installable when optional shell files fail. */ }
      }));
      try {
        const response = await fetch(APP_ROOT.href);
        if (response.ok && response.type === 'basic') {
          const html = await response.clone().text();
          await cache.put(APP_ROOT.href, response);
          const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
            .map((match) => new URL(match[1], APP_ROOT))
            .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(new URL('assets/', APP_ROOT).pathname));
          await Promise.all(assets.map(async (asset) => {
            try {
              const assetResponse = await fetch(asset.href);
              if (assetResponse.ok && assetResponse.type === 'basic') await cache.put(asset.href, assetResponse);
            } catch { /* Any uncached resource can still load while online. */ }
          }));
        }
      } catch { /* The app stays available online even if precaching fails. */ }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !isAppRequest(url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match(APP_ROOT.href));
      }
    }
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
