// FinBot SW — versão 20260303001221
// Estratégia: Network First — sempre busca versão nova, usa cache só se offline
const CACHE_NAME = 'finbot-20260303001221';
const OFFLINE_FILES = ['./index.html', './manifest.json'];

// Instala e armazena arquivos para uso offline
self.addEventListener('install', e => {
  console.log('[SW] Instalando versão 20260303001221');
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(OFFLINE_FILES))
  );
  // Ativa imediatamente sem esperar abas antigas fecharem
  self.skipWaiting();
});

// Remove caches antigos de versões anteriores
self.addEventListener('activate', e => {
  console.log('[SW] Ativando, limpando caches antigos...');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => { console.log('[SW] Deletando cache antigo:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// Network First: tenta rede primeiro, fallback para cache se offline
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Atualiza o cache com a resposta mais recente
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: usa cache
        return caches.match(e.request).then(r => r || caches.match('./index.html'));
      })
  );
});

// Escuta mensagem para forçar atualização
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
