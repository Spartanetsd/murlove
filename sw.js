// Service worker «МурLove»: застосунок працює без інтернету після першого відкриття.
// Після оновлення файлів на GitHub змініть VERSION — і телефон підтягне нову версію.
const VERSION = 'murlove-1.1.0'
const CORE = [
  './',
  './index.html',
  './app.js',
  './app.css',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache
          .addAll(CORE.map((u) => new Request(u, { cache: 'reload' })))
          .then(() => cache.add(new Request('./personal.json', { cache: 'reload' })).catch(() => {})),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Особисті тексти: спершу мережа (щоб правки на GitHub підхоплювались), офлайн — з кешу.
  if (url.pathname.endsWith('/personal.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put('./personal.json', copy))
          }
          return res
        })
        .catch(() => caches.match('./personal.json')),
    )
    return
  }

  // Сторінка: миттєво з кешу, інакше з мережі.
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('./index.html').then((hit) => hit || fetch(req)))
    return
  }

  // Решта: кеш, потім мережа.
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)))
})
