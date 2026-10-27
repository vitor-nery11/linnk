// Redirecionamento de compatibilidade e destruição de Service Worker obsoleto
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
}

if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then(keys => {
    for (const key of keys) {
      caches.delete(key);
    }
  });
}

// Se o navegador carregou o index.html antigo do Vortex pelo cache do Service Worker anterior
if (typeof document !== 'undefined' && (document.title.includes('Vortex') || !document.title.includes('LINNK'))) {
  if (!sessionStorage.getItem('__linnk_sw_purged__')) {
    sessionStorage.setItem('__linnk_sw_purged__', '1');
    window.location.reload();
  }
}

import './main.tsx';
