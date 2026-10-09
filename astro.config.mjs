import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function d1AuthPlugin() {
  return {
    name: 'd1-auth-local-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/debug-fetch')) {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            console.log('[BROWSER FETCH DESCRIPTOR]', body);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }

        if (
          req.url &&
          (req.url.startsWith('/api/auth') ||
            req.url.startsWith('/api/media') ||
            req.url.startsWith('/api/content'))
        ) {
          try {
            const { handleLocalApiRequest } = await import('./src/server/localD1Server.ts');
            await handleLocalApiRequest(req, res);
            return;
          } catch (err) {
            console.error('[Local API Plugin Error]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  server: {
    port: 3000,
    host: true,
  },
  redirects: {
    '/admin': '/admin/index.html',
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), d1AuthPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
