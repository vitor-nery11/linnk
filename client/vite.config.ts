import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function cleanupLegacyPwaPlugin(): Plugin {
  return {
    name: 'cleanup-legacy-pwa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as any).url || '';

        // Intercept any PWA virtual entries requested by stale cached index.html
        if (url.includes('@vite-plugin-pwa')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end('export default {};\nexport const useRegisterSW = () => ({ needRefresh: [false, () => {}], offlineReady: [false, () => {}], updateServiceWorker: () => {} });\n');
          return;
        }

        // Return a self-unregistering service worker script for any sw.js / workbox requests
        if (url.startsWith('/sw.js') || url.startsWith('/dev-sw.js') || url.includes('workbox-')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.end(`
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', (event) => {
              event.waitUntil(
                self.registration.unregister().then(() => {
                  return self.clients.matchAll();
                }).then(clients => {
                  clients.forEach(client => client.navigate(client.url));
                })
              );
            });
          `);
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cleanupLegacyPwaPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
