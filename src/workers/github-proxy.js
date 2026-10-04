/**
 * Cloudflare Worker Proxy for AstroPress CMS & GitHub REST API
 * 
 * Instructions:
 * 1. Create a new Cloudflare Worker in your Cloudflare dashboard (e.g. `astropress-github-proxy.yourname.workers.dev`).
 * 2. Set an encrypted environment variable / secret `GITHUB_PAT` in Cloudflare Worker settings (optional if passing token via header).
 * 3. Deploy this code to the worker.
 * 4. Paste your worker URL into AstroPress Admin -> "GitHub & Deployment" -> "Cloudflare Worker Proxy URL".
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Only forward requests to GitHub API
    const targetUrl = `https://api.github.com${path}${url.search}`;

    const headers = new Headers();
    headers.set('User-Agent', 'AstroPress-CMS-Cloudflare-Worker');
    headers.set('Accept', 'application/vnd.github.v3+json');

    // Prefer token from incoming Authorization header or worker secret
    const incomingAuth = request.headers.get('Authorization');
    const secretToken = env.GITHUB_PAT;
    
    if (incomingAuth) {
      headers.set('Authorization', incomingAuth);
    } else if (secretToken) {
      headers.set('Authorization', `Bearer ${secretToken}`);
    }

    if (request.headers.get('Content-Type')) {
      headers.set('Content-Type', request.headers.get('Content-Type'));
    }

    try {
      const gitHubResponse = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      });

      const responseHeaders = new Headers(gitHubResponse.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

      return new Response(gitHubResponse.body, {
        status: gitHubResponse.status,
        statusText: gitHubResponse.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Proxy Error' }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
