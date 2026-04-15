// LEVEL 3 — "THE TRUSTED MESSENGER"
// Vulnerability: SSRF — Server Side Request Forgery (OWASP A10:2021)
// The app has a "URL preview" feature. It fetches any URL server-side.
// Internal metadata endpoint at http://127.0.0.1:9000/internal/secret returns the flag.
// Player must send url=http://127.0.0.1:9000/internal/secret

const express = require('express');
const router = express.Router();
const path = require('path');
const http = require('http');

// Simulated internal service — only accessible from localhost
const INTERNAL_SERVER_PORT = 9000;
let internalStarted = false;

function startInternalServer() {
  if (internalStarted) return;
  internalStarted = true;
  const internalApp = express();
  internalApp.get('/internal/secret', (req, res) => {
    res.json({
      service: 'internal-metadata',
      environment: 'production',
      secret_key: 'sk_prod_x9f2k1',
      flag: 'FLAG{SSRF_1nt3rn4l_S3rv1c3s_Ar3_N0t_S4f3}',
      note: 'This endpoint should NEVER be reachable from outside.'
    });
  });
  internalApp.get('/internal/health', (req, res) => {
    res.json({ status: 'healthy', version: '2.1.4', uptime: process.uptime() });
  });
  internalApp.listen(INTERNAL_SERVER_PORT, '127.0.0.1', () => {
    console.log(`[LEVEL3] Internal service running on 127.0.0.1:${INTERNAL_SERVER_PORT}`);
  });
}

startInternalServer();

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Vulnerable URL fetcher — no allowlist, no SSRF protection
router.post('/api/preview', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  // Only block obviously external schemas — internal IPs still allowed (the vulnerability)
  if (url.startsWith('file://') || url.startsWith('ftp://')) {
    return res.status(400).json({ error: 'Protocol not supported.' });
  }

  console.log(`[LEVEL3] Server fetching URL: ${url}`);

  try {
    // Simple HTTP fetch (intentionally no SSRF protection)
    const fetchUrl = new URL(url);
    const options = {
      hostname: fetchUrl.hostname,
      port: fetchUrl.port || (fetchUrl.protocol === 'https:' ? 443 : 80),
      path: fetchUrl.pathname + fetchUrl.search,
      method: 'GET',
      timeout: 3000
    };

    const data = await new Promise((resolve, reject) => {
      const req2 = http.request(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body, headers: r.headers }));
      });
      req2.on('error', reject);
      req2.on('timeout', () => { req2.destroy(); reject(new Error('Timeout')); });
      req2.end();
    });

    return res.json({
      fetched: url,
      status: data.status,
      contentType: data.headers['content-type'] || 'unknown',
      body: data.body.substring(0, 2000)
    });
  } catch (e) {
    return res.status(502).json({ error: 'Fetch failed: ' + e.message, url });
  }
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{SSRF_1nt3rn4l_S3rv1c3s_Ar3_N0t_S4f3}') {
    req.session.ctf.solvedLevels.push(3);
    req.session.ctf.currentLevel = 4;
    return res.json({ success: true, message: 'INTERNAL BOUNDARY BREACHED.', flavour: "You turned the server into your personal proxy. It fetched secrets it was never meant to share. Next: what if your input isn't just read — what if it gets stored and then executed in someone else's browser?", nextLevel: '/level4' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
