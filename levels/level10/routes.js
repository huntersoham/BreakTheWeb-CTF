// LEVEL 10 — "THE FINAL CHAIN"
// Vulnerability: Chained Exploits — IDOR + SQLi + JWT Forgery (OWASP Multi-category)
// This is the final boss. Three steps must be chained:
//
// STEP 1 (IDOR): GET /level10/api/users → lists user IDs (guest visible)
//   Change user_id cookie to 7 → access /api/userdata/7 → reveals a JWT secret hint
//
// STEP 2 (SQLi): POST /level10/api/lookup with { code: "' OR 1=1--" }
//   Returns hidden vault entry containing an encrypted token fragment
//
// STEP 3 (JWT Forge): Combine the secret from step 1 with the fragment from step 2
//   POST /level10/api/vault/access with forged JWT (role:superadmin) → flag
//
// Each step's response hints at the next step.

const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');

// The chain secret — discoverable via IDOR on user 7
const CHAIN_SECRET = 'ch41n_s3cr3t_k3y';

const USERS = {
  1: { id: 1, username: 'guest_user', role: 'guest' },
  2: { id: 2, username: 'developer', role: 'dev' },
  3: { id: 3, username: 'analyst', role: 'user' },
  7: { id: 7, username: 'vault_keeper', role: 'system', jwtHint: 'Signing key starts with "ch41n"', secretFragment: 'ch41n_s3cr3t_k3y', note: 'IDOR: you were not supposed to see this.' }
};

// Vault codes DB (SQLi target)
const VAULT_CODES = [
  { id: 1, code: 'ALPHA-001', label: 'Standard Entry', visible: true },
  { id: 2, code: 'BETA-002', label: 'Developer Access', visible: true },
  { id: 3, code: 'OMEGA-999', label: '[RESTRICTED] Vault Fragment', visible: false, fragment: 'use_jwt_role_superadmin' }
];

function fakeVaultSQL(input) {
  const q = input.toLowerCase();
  const injected = q.includes("' or") || q.includes("1=1") || q.includes("'--") ||
                   q.includes("' --") || q.includes("union") || (q.includes("'") && q.includes("or"));
  if (injected) return VAULT_CODES;
  return VAULT_CODES.filter(r => r.visible && r.code.toLowerCase().includes(q.toLowerCase()));
}

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// STEP 1a: List users (shows IDs — hints at IDOR)
router.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, username: 'guest_user' },
      { id: 2, username: 'developer' },
      { id: 3, username: 'analyst' }
      // user 7 is hidden from listing but accessible via direct ID
    ],
    note: 'Standard user listing. IDs are sequential.'
  });
});

// STEP 1b: IDOR on /api/userdata/:id
router.get('/api/userdata/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = USERS[id];
  if (!user) return res.json({ id, username: `user_${id}`, role: 'unknown' });
  console.log(`[LEVEL10] IDOR: userdata accessed for id=${id}`);
  return res.json(user);
});

// STEP 2: SQLi on vault code lookup
router.post('/api/lookup', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const results = fakeVaultSQL(code);
  console.log(`[LEVEL10] Vault lookup: "${code}" → ${results.length} rows`);
  return res.json({
    results,
    query: `SELECT * FROM vault WHERE code LIKE '%${code}%' AND visible=1`
  });
});

// STEP 3: JWT-protected vault access — issues token to start, validates forged one
router.post('/api/vault/token', (req, res) => {
  // Issues a guest JWT — player must forge it with role:superadmin
  const token = jwt.sign({ username: 'guest', role: 'guest' }, CHAIN_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  res.json({ token, message: 'Guest token issued. Vault access requires elevation.' });
});

router.post('/api/vault/access', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Bearer token required.' });

  try {
    const payload = jwt.verify(token, CHAIN_SECRET);
    console.log(`[LEVEL10] Vault access: role=${payload.role}`);

    if (payload.role === 'superadmin') {
      return res.json({
        access: 'VAULT_UNLOCKED',
        role: payload.role,
        flag: 'FLAG{CH41N3D_1D0R_SQLi_JWT_3xpl01t_M4st3r}',
        message: 'All three locks defeated. The vault is yours.',
        steps: ['IDOR → secret key', 'SQLi → vault fragment', 'JWT forge → superadmin']
      });
    }

    return res.json({
      access: 'PARTIAL',
      role: payload.role,
      message: 'Valid token, insufficient role. You need superadmin.',
      hint: 'You have the signing key. Upgrade your role.'
    });
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token: ' + e.message });
  }
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{CH41N3D_1D0R_SQLi_JWT_3xpl01t_M4st3r}') {
    req.session.ctf.solvedLevels.push(10);
    req.session.ctf.currentLevel = 11;
    return res.json({
      success: true,
      message: 'ALL LEVELS CONQUERED.',
      flavour: "Three vulnerabilities. One chain. You found the gap in each defense, linked them together, and broke what was meant to be unbreakable. That is what a real attacker does. That is what a real defender must understand. Well played.",
      complete: true
    });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag. All three locks must fall.' });
});

module.exports = router;
