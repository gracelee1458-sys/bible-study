const CACHE_NAME = 'bible-tracker-v1';
const urlsToCache = [
  '/bible-study/',
  '/bible-study/index.html',
  '/bible-study/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 등록됨');
        return cache.addAll(urlsToCache.filter(url => !url.includes('cdn')));
      })
      .catch(err => console.log('캐시 등록 실패:', err))
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  // GET 요청만 캐싱
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 있으면 반환
        if (response) {
          return response;
        }

        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(event.request)
          .then(response => {
            // Supabase API는 캐싱하지 않음
            if (event.request.url.includes('supabase')) {
              return response;
            }

            // 성공한 응답만 캐싱
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(err => {
            console.log('네트워크 요청 실패:', err);
            
            // 오프라인일 때 캐시된 페이지 반환
            return caches.match('/bible-study/index.html');
          });
      })
  );
});

// Background Sync (백그라운드에서 데이터 동기화)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reading') {
    event.waitUntil(syncReadingLogs());
  }
});

async function syncReadingLogs() {
  try {
    // 로컬 스토리지에 저장된 오프라인 데이터 동기화
    const pendingLogs = JSON.parse(localStorage.getItem('pendingLogs') || '[]');
    
    if (pendingLogs.length > 0) {
      // Supabase와 동기화
      for (const log of pendingLogs) {
        // 동기화 로직은 메인 스크립트에서 처리
      }
      localStorage.setItem('pendingLogs', '[]');
    }
  } catch (err) {
    console.error('동기화 실패:', err);
  }
}
