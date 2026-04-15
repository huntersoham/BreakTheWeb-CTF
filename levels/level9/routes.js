// LEVEL 9 — "THE FORGED SIGNATURE"
// Vulnerability: CSRF — Cross-Site Request Forgery (OWASP A01:2021)
// The app has an admin action: POST /level9/api/admin/promote
// It checks for a session cookie but NOT a CSRF token.
// Player logs in as guest, then crafts a raw cross-origin POST to /api/admin/promote
// with body { target: "guest", action: "promote" } — no CSRF token required.
// The endpoint promotes the user and returns the flag.

const express = require('express');
const router = express.Router();
const path = require('path');

const SESSION_STORE = {}; // token → user

function makeToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'guest' && password === 'guest') {
    const tok = makeToken();
    SESSION_STORE[tok] = { username: 'guest', role: 'user' };
    res.cookie('l9_session', tok, { httpOnly: false, sameSite: 'none' });
    console.log(`[LEVEL9] Login: guest, token=${tok}`);
    return res.json({ success: true, message: 'Logged in as guest.' });
  }
  return res.status(401).json({ error: 'Invalid. Use guest/guest.' });
});

// CSRF-vulnerable endpoint: checks session cookie, but NO CSRF token required
// Origin/Referer headers are intentionally NOT checked
router.post('/api/admin/promote', (req, res) => {
  // Get session from cookie OR Authorization header (to support both browser and Burp/curl)
  const cookieToken = req.cookies.l9_session;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;

  const user = token ? SESSION_STORE[token] : null;

  // No CSRF token check — the vulnerability
  // No Origin/Referer validation — the vulnerability
  console.log(`[LEVEL9] /promote called. token=${token}, user=${user ? user.username : 'none'}`);

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated. Login first.' });
  }

  // Promote the user
  user.role = 'admin';
  SESSION_STORE[token] = user;

  console.log(`[LEVEL9] CSRF: ${user.username} promoted to admin without CSRF token!`);
  return res.json({
    success: true,
    message: 'Role updated to admin.',
    username: user.username,
    role: user.role,
    flag: 'FLAG{CSRF_N0_T0k3n_St4t3_Ch4ng3d_By_F0rg3d_R3qu3st}',
    note: 'No CSRF token was required. This request could have come from anywhere.'
  });
});

router.get('/api/me', (req, res) => {
  const tok = req.cookies.l9_session;
  const user = tok ? SESSION_STORE[tok] : null;
  if (!user) return res.status(401).json({ error: 'Not logged in.' });
  res.json({ username: user.username, role: user.role });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{CSRF_N0_T0k3n_St4t3_Ch4ng3d_By_F0rg3d_R3qu3st}') {
    req.session.ctf.solvedLevels.push(9);
    req.session.ctf.currentLevel = 10;
    return res.json({ success: true, message: 'STATE CHANGED WITHOUT CONSENT.', flavour: "A forged request, indistinguishable from a real one. The server had no way to know. One level remains — and it uses everything you've learned.", nextLevel: '/level10' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
