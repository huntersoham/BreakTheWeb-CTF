// LEVEL 4 — "ECHOES IN THE DARK"
// Vulnerability: Stored XSS (OWASP A03:2021 — Injection)
// A "feedback" board stores comments. No sanitization. 
// Player must post a comment with a <script> that calls /level4/api/admin-cookie
// The simulated admin bot "visits" the page every POST, executes scripts, and its
// cookie gets sent to /level4/api/exfil?data=... where the flag is revealed.

const express = require('express');
const router = express.Router();
const path = require('path');

// In-memory comment store
const comments = [
  { id: 1, author: 'sys_admin', text: 'Board initialized. Staff only.', ts: Date.now() - 900000 },
  { id: 2, author: 'dev_ops', text: 'Testing comment system. Looks good.', ts: Date.now() - 300000 }
];

let nextId = 3;

// Simulated admin cookie (never sent to browser — only readable via XSS exfil)
const ADMIN_COOKIE = 'admin_session=FLAG{XSS_St0r3d_4nd_3x3cut3d_C00k13_St0l3n}';

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Get all comments — UNSAFE: returns raw unsanitized text
router.get('/api/comments', (req, res) => {
  res.json({ comments });
});

// Post a comment — UNSAFE: no sanitization
router.post('/api/comment', (req, res) => {
  const { author, text } = req.body;
  if (!text || !author) return res.status(400).json({ error: 'Author and text required.' });

  const comment = { id: nextId++, author: author.substring(0, 30), text: text.substring(0, 500), ts: Date.now() };
  comments.push(comment);

  // Simulate admin bot visiting — detects XSS payload in stored comments
  const hasScript = comments.some(c =>
    c.text.toLowerCase().includes('<script') ||
    c.text.toLowerCase().includes('onerror') ||
    c.text.toLowerCase().includes('onload') ||
    c.text.toLowerCase().includes('javascript:') ||
    c.text.toLowerCase().includes('img src') ||
    c.text.toLowerCase().includes('<img')
  );

  console.log(`[LEVEL4] Comment posted by "${author}". XSS detected: ${hasScript}`);

  if (hasScript) {
    // Admin bot "executes" the payload — triggers exfil with admin cookie
    console.log(`[LEVEL4] Admin bot triggered. Cookie would be exfiltrated.`);
    return res.json({
      success: true,
      comment,
      adminAlert: 'Admin bot visited the page.',
      exfiltrated: ADMIN_COOKIE  // In a real scenario this goes to attacker's server
    });
  }

  return res.json({ success: true, comment });
});

// Exfiltration endpoint — simulates attacker's listener
router.get('/api/exfil', (req, res) => {
  const data = req.query.data || '';
  console.log(`[LEVEL4] EXFIL RECEIVED: ${data}`);
  if (data.includes('FLAG{')) {
    return res.json({ received: data, note: 'Data exfiltrated successfully.' });
  }
  // Even without the full flag in URL, reveal it since they found this endpoint via XSS logic
  res.json({ received: data, hint: 'Try posting a script that sends document.cookie here.' });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{XSS_St0r3d_4nd_3x3cut3d_C00k13_St0l3n}') {
    req.session.ctf.solvedLevels.push(4);
    req.session.ctf.currentLevel = 5;
    return res.json({ success: true, message: "ADMIN COOKIE STOLEN. SESSION HIJACKED.", flavour: "Your code ran in someone else's browser without their knowledge. Now: not every secret is locked away — sometimes servers just leave their drawers open.", nextLevel: '/level5' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
