// LEVEL 8 — "THE HELPFUL DETOUR"
// Vulnerability: Open Redirect + Sensitive Data in URL (OWASP A01:2021 / A09:2021)
// App has a login that redirects to ?next= after auth. No validation on redirect target.
// The /api/token-refresh endpoint includes a token in the redirect URL.
// Player must:
//   1. Notice the ?next= parameter in login redirect
//   2. Set next= to /level8/api/steal (attacker-controlled endpoint)
//   3. Trigger the token refresh which redirects with token in URL
//   4. The steal endpoint logs the token = flag

const express = require('express');
const router = express.Router();
const path = require('path');

const HIDDEN_TOKEN = 'FLAG{0p3n_R3d1r3ct_T0k3n_L34k4g3_V14_URL}';

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Login page — accepts ?next= for post-login redirect (vulnerable)
router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const next = req.query.next || req.body.next || '/level8/dashboard';

  if (username === 'guest' && password === 'guest123') {
    // VULNERABILITY: Redirects to unvalidated user-controlled URL
    const redirectUrl = next + '?auth_token=' + Buffer.from(HIDDEN_TOKEN).toString('base64');
    console.log(`[LEVEL8] Login redirect → ${redirectUrl}`);
    return res.json({
      success: true,
      redirect: redirectUrl,
      message: 'Login successful. Redirecting...'
    });
  }
  return res.status(401).json({ error: 'Invalid credentials. Try guest/guest123.' });
});

// Legitimate dashboard
router.get('/dashboard', (req, res) => {
  const token = req.query.auth_token;
  if (!token) return res.redirect('/level8');
  res.json({ page: 'dashboard', message: 'Welcome, guest. Nothing interesting here.', tokenPresent: true });
});

// "Attacker-controlled" endpoint — simulates exfil destination
router.get('/api/steal', (req, res) => {
  const token = req.query.auth_token;
  if (token) {
    let decoded = '';
    try { decoded = Buffer.from(token, 'base64').toString('utf8'); } catch(e) {}
    console.log(`[LEVEL8] TOKEN STOLEN VIA OPEN REDIRECT: ${decoded}`);
    return res.json({
      received: token,
      decoded: decoded,
      message: 'Token successfully stolen via open redirect.',
      note: decoded.startsWith('FLAG{') ? decoded : 'Decode the base64 to get your flag.'
    });
  }
  res.json({ message: 'No token received. Set this URL as the ?next= destination.' });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{0p3n_R3d1r3ct_T0k3n_L34k4g3_V14_URL}') {
    req.session.ctf.solvedLevels.push(8);
    req.session.ctf.currentLevel = 9;
    return res.json({ success: true, message: 'REDIRECT WEAPONIZED. TOKEN STOLEN.', flavour: "You controlled where the server sent its secrets. A redirect is a loaded gun if the destination isn't verified. Next: state-changing requests — are they really from who the server thinks?", nextLevel: '/level9' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
