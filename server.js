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
 * `responseCache` maps a currency code (e.g. "EUR") to an entry that holds
 * the raw JSON body returned by Frankfurter and the timestamp at which it was
 * stored.  Entries are written on the first successful upstream response and
 * served on every subsequent identical request, provided the entry is younger
 * than CACHE_TTL_MS (24 hours).  Expired entries are evicted on the next read
 * and a fresh upstream request is made.
 *
 * Consequence for E2E tests: the backend process is started once per test
 * suite run (by the Vite plugin in vite.config.ts).  Because every test that
 * requests the same base currency shares the same process, and a test suite
 * finishes well within 24 hours, Frankfurter is contacted at most once per
 * unique currency code per test suite execution.
 *
 * Consequence for production (`npm run prod`): `vite preview` starts the
 * backend via the same Vite plugin.  Exchange rates are refreshed at most once
 * per currency per 24-hour window, reducing upstream traffic while keeping
 * the data reasonably fresh.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const PORT = 3001;

/** Only accept well-formed ISO 4217 codes (3 uppercase ASCII letters). */
const CURRENCY_RE = /^[A-Z]{3}$/;

/** Cache entry: the raw response body and the time it was stored. */
interface CacheEntry {
  body: string;
  cachedAt: number;
}

/** Maximum age of a cache entry before it is considered stale (24 hours). */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * In-process response cache.
 * Key:   ISO 4217 currency code (e.g. "EUR")
 * Value: CacheEntry (body + timestamp)
 */
const responseCache = new Map<string, CacheEntry>();

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

    // Return cached body if available and still fresh (< 24 h old).
    const cached = responseCache.get(from);
    if (cached !== undefined) {
      if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(cached.body);
        return;
      }
      // Entry has expired – remove it and fall through to a fresh fetch.
      responseCache.delete(from);
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
            responseCache.set(from, { body, cachedAt: Date.now() });
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
