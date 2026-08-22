// Service worker minimal, écrit à la main (pas de librairie type
// workbox/next-pwa — voir docs/decisions/008 pour le raisonnement : ce
// dépôt build avec Turbopack, ces librairies reposent sur un plugin
// webpack). Portée volontairement réduite à ce que demande le backlog
// ("fonctionnement offline partiel") : coquille + page de repli, jamais de
// cache pour une réponse authentifiée/personnalisée.
//
// CACHE_NAME à incrémenter manuellement à chaque modification de ce fichier
// (purge automatique des anciens caches dans "activate" ci-dessous).
const CACHE_NAME = "thermik-shell-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jamais de cache pour les Server Actions (POST) ni les Route Handlers
  // (/api/*, y compris Better Auth) : réponses authentifiées/personnalisées
  // par utilisateur, ne doivent jamais être servies depuis un cache partagé
  // entre sessions.
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Cross-origin (polices Google, CDN, etc. le cas échéant) : laissé au
  // comportement réseau par défaut du navigateur, pas de mise en cache.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation (changement de page) : réseau d'abord, repli sur la page
  // /offline mise en cache si la requête échoue faute de réseau.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Assets statiques immuables (_next/static, icônes, manifest) : seuls ceux-là
  // passent en cache d'abord, réseau en repli avec mise en cache opportuniste.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Reste (requêtes RSC de prefetch/navigation client vers une page comme
  // /activities, qui partage le même chemin que la page elle-même) : jamais
  // intercepté. Un cache-first ici resservirait une liste d'activités périmée
  // juste après une création/modification — laissé au réseau par défaut.
});

// _next/static/* : fichiers de build hashés par contenu, sûrs en cache
// d'abord. Icônes/manifest générés par convention Next.js (app/icon.tsx,
// apple-icon.tsx, manifest.ts...) : chemins fixes, changent rarement, aucun
// ne coïncide avec une route applicative (docs/decisions listent les routes
// (app)/(admin)/(auth), aucune ne commence par ces préfixes).
const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//,
  /^\/favicon\.ico$/,
  /^\/icon(-512|-maskable)?$/,
  /^\/apple-icon$/,
  /^\/manifest\.webmanifest$/,
];

function isStaticAsset(pathname) {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}
