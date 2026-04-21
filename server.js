/**
 * Exchange-rate proxy server.
 *
 * Accepts:  GET /api/exchange-rates?from=<ISO-4217>
 * Proxies:  https://api.frankfurter.app/latest?from=<currency>
 * Returns:  the Frankfurter JSON payload unchanged.
 *
 * Running the request on the server side avoids the browser CORS restriction
 * because server-to-server HTTP calls are not subject to the same-origin
 * policy enforced by browsers.
 *
 * Port: 3001 (Vite dev server stays on its default 5173; the Vite proxy
 *             forwards /api/* from 5173 → 3001 during development).
 *
 * Response cache
 * ──────────────
 * `responseCache` maps a currency code (e.g. "EUR") to the raw JSON body
 * returned by Frankfurter for that base currency.  Entries are written on
 * the first successful upstream response and read for every subsequent
 * identical request within the same server-process lifetime.
 *
 * Consequence for E2E tests: the backend process is started once per test
 * suite run (by the Vite plugin in vite.config.ts).  Because every test that
 * requests the same base currency shares the same process, Frankfurter is
 * contacted at most once per unique currency code per test suite execution.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const PORT = 3001;

/** Only accept well-formed ISO 4217 codes (3 uppercase ASCII letters). */
const CURRENCY_RE = /^[A-Z]{3}$/;

/**
 * In-process response cache.
 * Key:   ISO 4217 currency code (e.g. "EUR")
 * Value: raw JSON body received from Frankfurter for that base currency
 */
const responseCache = new Map<string, string>();

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (reqUrl.pathname === '/api/exchange-rates' && req.method === 'GET') {
    const from = reqUrl.searchParams.get('from') ?? 'EUR';

    if (!CURRENCY_RE.test(from)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ error: 'Invalid currency code. Expected ISO 4217 (3 uppercase letters).' }),
      );
      return;
    }

    // Return cached body if available (no upstream call needed).
    const cached = responseCache.get(from);
    if (cached !== undefined) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(cached);
      return;
    }

    const apiUrl = `https://api.frankfurter.app/latest?from=${from}`;

    https
      .get(apiUrl, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => {
          body += chunk;
        });
        apiRes.on('end', () => {
          // Cache only successful responses so a transient upstream error
          // does not permanently poison the cache for this process lifetime.
          if (apiRes.statusCode === 200) {
            responseCache.set(from, body);
          }
          res.writeHead(apiRes.statusCode ?? 502, {
            'Content-Type': 'application/json',
          });
          res.end(body);
        });
      })
      .on('error', (err) => {
        console.error('[server] Failed to reach Frankfurter API:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch exchange rates from upstream.' }));
      });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[server] Exchange-rate proxy listening on http://localhost:${PORT}`);
});
