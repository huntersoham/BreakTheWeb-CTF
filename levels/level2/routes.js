// LEVEL 2 — "THE WHISPERING BOX"
// Vulnerability: SQL Injection (OWASP A03:2021 — Injection)
// Player searches for products. Input is directly "concatenated" into simulated SQL.
// Injecting ' OR '1'='1 dumps all rows including the hidden restricted product with flag.
const express = require('express');
const router = express.Router();
const path = require('path');

const DB_ROWS = [
  { id: 1, name: 'Encrypted USB Drive', price: '$49.99', category: 'hardware', visible: true },
  { id: 2, name: 'VPN Subscription', price: '$9.99/mo', category: 'software', visible: true },
  { id: 3, name: 'Security Audit Tool', price: '$199.99', category: 'software', visible: true },
  { id: 4, name: 'Firewall Appliance', price: '$299.00', category: 'hardware', visible: true },
  { id: 5, name: '[CLASSIFIED] Root Access Token', price: 'N/A', category: 'restricted', visible: false, flag: 'FLAG{SQLi_Wh3r3_Cl4us3_Byp4ss_M4st3r}' }
];

function vulnerableSearch(input) {
  // Simulates: SELECT * FROM products WHERE name LIKE '%<input>%' AND visible=1
  // Injection detected by classic bypass patterns
  const q = input.toLowerCase();
  const injected =
    q.includes("' or") || q.includes("'or") || q.includes("1=1") ||
    q.includes("' --") || q.includes("'--") || q.includes("union select") ||
    q.includes("or '1'='1") || q.includes("or 1=1") || q.includes("\" or ") ||
    q.includes("' ||") || (q.includes("'") && q.includes("or"));
  if (injected) return DB_ROWS; // bypass: returns ALL including hidden
  return DB_ROWS.filter(r => r.visible && r.name.toLowerCase().includes(q));
}

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

router.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json({ results: [], query: q });
  const results = vulnerableSearch(q);
  const out = results.map(r => ({
    id: r.id, name: r.name, price: r.price, category: r.category,
    ...(r.flag ? { classified: r.flag } : {})
  }));
  console.log(`[LEVEL2] Search: "${q}" → ${results.length} rows`);
  return res.json({ results: out, query: q, sql: `SELECT * FROM products WHERE name LIKE '%${q}%' AND visible=1` });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{SQLi_Wh3r3_Cl4us3_Byp4ss_M4st3r}') {
    req.session.ctf.solvedLevels.push(2);
    req.session.ctf.currentLevel = 3;
    return res.json({ success: true, message: 'QUERY BROKEN. DATABASE CONFESSED.', flavour: "You bent the database to your will. It trusted your words — and you weaponized them. Now: what if the server makes web requests on your behalf? Whose network can it reach that you can't?", nextLevel: '/level3' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag. The database stays silent.' });
});

module.exports = router;
