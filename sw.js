/* =====================================================
   COUNTRYLIFE – SERVICE WORKER
   =====================================================
   Rende il sito installabile e funzionante anche senza rete.

   Strategia:
   - navigazioni (pagine HTML): rete prima, cache come ripiego
   - risorse statiche del sito: cache prima (veloce), rete come aggiornamento
   - richieste esterne (Firebase, Google Fonts, immagini): pass-through,
     NON vengono mai memorizzate. Motivo: i dati dell'app devono
     arrivare freschi dal server, e la cache dei dati è pericolosa
     (potresti vedere eventi vecchi o, peggio, dati di altri utenti).

   Dopo ogni modifica ai file statici, cambiare CACHE_VERSION:
     - cambiare la versione invalida le vecchie cache e forza l'aggiornamento
     - non cambiarlo fa restare agli utenti la versione precedente
   ===================================================== */

'use strict';

const CACHE_VERSION = 'v1';
const CACHE_NAME = `countrylife-${CACHE_VERSION}`;

/* Risorse da mettere in cache al primo avvio (precache). */
const PRECACHE = [
  '/',
  '/index.html',
  '/eventi.html',
  '/privacy.html',
  '/app/',
  '/app/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/style.css',
  '/css/eventi.css',
  '/css/app.css',
  '/js/data.js',
  '/js/main.js',
  '/js/eventi.js',
  '/app/js/config.js',
  '/app/js/store.js',
  '/app/js/auth.js',
  '/app/js/ui.js',
  '/app/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

/* ─── Installazione ─────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll fallisce se un singolo file manca: meglio aggiungere
    // i file uno a uno cosi' un 404 non blocca l'installazione.
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[sw] precache saltato:', url, err.message);
      }
    }));
    await self.skipWaiting();
  })());
});

/* ─── Attivazione: elimina le cache delle versioni vecchie ──────── */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('countrylife-') && k !== CACHE_NAME)
        .map((k) => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* ─── Richieste ─────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET: POST/PUT/DELETE verso Firestore non si toccano mai.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const stessoOrigine = url.origin === self.location.origin;

  // Richieste verso Firebase / Google: mai in cache.
  const dominiDaNonToccare = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'www.googleapis.com',
    'accounts.google.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'www.genspark.ai'
  ];
  if (dominiDaNonToccare.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))) {
    return;
  }

  // Navigazioni: rete prima, poi cache, poi offline.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        const fallback = await caches.match('/offline.html');
        if (fallback) return fallback;
        return new Response(
          '<h1>Offline</h1><p>Sei offline e questa pagina non e\' in cache.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
        );
      }
    })());
    return;
  }

  // Risorse statiche della stessa origine: cache prima, poi rete.
  if (stessoOrigine) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) {
        // Aggiorna in background senza bloccare la risposta
        event.waitUntil((async () => {
          try {
            const fresh = await fetch(req);
            if (fresh && fresh.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(req, fresh.clone());
            }
          } catch (e) { /* offline: si tiene la copia in cache */ }
        })());
        return cached;
      }
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
  }
});

/* ─── Messaggi dalla pagina ─────────────────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
