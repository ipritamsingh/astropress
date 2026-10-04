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
        if (req.url && (req.url.startsWith('/api/auth') || req.url === '/api/auth')) {
          try {
            const { handleLocalAuthRequest } = await import('./src/server/localD1Server.ts');
            await handleLocalAuthRequest(req, res);
            return;
          } catch (err) {
            console.error('[D1 Local Auth Plugin Error]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal D1 Server Error' }));
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
