// LEVEL 6 — "SIGNED, UNSIGNED"
// Vulnerability: Broken Authentication — JWT Algorithm Confusion (OWASP A07:2021)
// The server issues JWT tokens. The token's alg can be changed to "none"
// and the signature stripped entirely, or the weak secret can be exploited.
// Player must modify their JWT: change role to "admin" and either:
//   (a) set alg:"none" and strip signature, OR
//   (b) re-sign with the weak secret "secret" (hardcoded)
// Then call /level6/api/dashboard with the forged token.

const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');

const WEAK_SECRET = 'secret'; // intentionally weak

function decodeJWTManual(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return { header, payload, parts };
  } catch { return null; }
}

function verifyVulnerable(token) {
  if (!token) return { valid: false, reason: 'No token' };
  const decoded = decodeJWTManual(token);
  if (!decoded) return { valid: false, reason: 'Malformed token' };

  const { header, payload } = decoded;

  // VULNERABILITY 1: alg:none accepted — no signature verification
  if (header.alg === 'none' || header.alg === 'None' || header.alg === 'NONE') {
    console.log(`[LEVEL6] alg:none bypass used! payload:`, payload);
    return { valid: true, payload, method: 'none-bypass' };
  }

  // VULNERABILITY 2: weak secret "secret"
  try {
    const verified = jwt.verify(token, WEAK_SECRET);
    return { valid: true, payload: verified, method: 'weak-secret' };
  } catch(e) {
    return { valid: false, reason: 'Signature verification failed: ' + e.message };
  }
}

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Issue a legitimate guest token
router.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const token = jwt.sign(
    { username: username.substring(0, 20), role: 'guest', iat: Math.floor(Date.now()/1000) },
    WEAK_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  console.log(`[LEVEL6] Token issued for: ${username}`);
  res.json({ token, message: 'Token issued. Guest access only.' });
});

// Protected dashboard — vulnerable JWT verification
router.get('/api/dashboard', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const result = verifyVulnerable(token);
  if (!result.valid) {
    return res.status(401).json({ error: 'Unauthorized', reason: result.reason });
  }

  const { payload } = result;
  console.log(`[LEVEL6] Dashboard accessed by role=${payload.role}, method=${result.method}`);

  if (payload.role === 'admin') {
    return res.json({
      access: 'ADMIN_PANEL',
      username: payload.username,
      role: payload.role,
      bypassMethod: result.method,
      flag: 'FLAG{JWT_4lg_N0n3_0r_W34k_S3cr3t_Byp4ss}',
      systemNote: 'Welcome to the admin panel. You should not be here.'
    });
  }

  return res.json({
    access: 'GUEST_PANEL',
    username: payload.username,
    role: payload.role,
    message: 'Guest access. Admin panel requires elevated role.',
    hint: 'Your token defines who you are. Tokens can be modified.'
  });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{JWT_4lg_N0n3_0r_W34k_S3cr3t_Byp4ss}') {
    req.session.ctf.solvedLevels.push(6);
    req.session.ctf.currentLevel = 7;
    return res.json({ success: true, message: 'IDENTITY FORGED. ADMIN ACCESS GRANTED.', flavour: "You rewrote your own credentials and the server believed you. Trust is dangerous. Next: what if the server accepts more data than it asks for?", nextLevel: '/level7' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
