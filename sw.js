// 贵阳旅行攻略 Service Worker
// 缓存策略：安装时缓存核心资源，运行时网络优先

var CACHE_NAME = 'guiyang-trip-v1';

var CORE_FILES = [
  '/',
  '/guiyang-travel-guide.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_FILES).catch(function(err) {
        // 某个文件失败不阻止安装
        console.warn('SW cache warning:', err);
      });
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败时回退缓存
self.addEventListener('fetch', function(event) {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // 跳过 CDN 资源（地图等）
  var url = event.request.url;
  if (url.indexOf('unpkg.com') > -1 || url.indexOf('cdn.') > -1 ||
      url.indexOf('leaflet') > -1 || url.indexOf('tile.openstreetmap') > -1 ||
      url.indexOf('geoq.cn') > -1 || url.indexOf('amap.com') > -1 ||
      url.indexOf('apple.com') > -1) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // 网络成功 → 缓存一份
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function() {
      // 网络失败 → 尝试缓存
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('离线状态下不可用', { status: 503 });
      });
    })
  );
});
