import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function fetchProxyPlugin(): Plugin {
  return {
    name: 'fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch', async (req, res) => {
        const query = req.url?.split('?')[1] || '';
        const url = new URLSearchParams(query).get('url');

        if (!url) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          const resp = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; RSVP-Speed-Reader/2.0)',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!resp.ok) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: `Upstream returned ${resp.status} ${resp.statusText}`,
              })
            );
            return;
          }

          const html = await resp.text();
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({ error: `Failed to fetch: ${(e as Error).message}` })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fetchProxyPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});