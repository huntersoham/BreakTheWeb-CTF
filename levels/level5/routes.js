// LEVEL 5 — "THE OPEN ARCHIVE"
// Vulnerability: Security Misconfiguration (OWASP A05:2021)
// A .env file and backup config are exposed at predictable paths.
// Player must discover: /level5/.env or /level5/config.bak
// The flag is inside the exposed environment file.

const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// robots.txt — hints at hidden paths (realistic misconfiguration)
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /level5/admin/
Disallow: /level5/backup/
Disallow: /level5/.env
# Please don't index our internal tools
`);
});

// Exposed .env file — classic misconfiguration
router.get('/.env', (req, res) => {
  console.log(`[LEVEL5] .env file accessed from ${req.ip}`);
  res.type('text/plain');
  res.send(`# Production Environment Config
# DO NOT COMMIT THIS FILE

NODE_ENV=production
PORT=3000
DB_HOST=10.0.0.5
DB_PORT=5432
DB_NAME=prod_ctfdb
DB_USER=ctfadmin
DB_PASS=s3cr3t_db_p4ss!

JWT_SECRET=jwt_sup3r_s3cr3t_k3y_2025
SESSION_SECRET=s3ss10n_s3cr3t_xyz

STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXX
INTERNAL_API_KEY=int_4pi_k3y_9f2k1m3

# Flag for CTF challenge
CTF_FLAG=FLAG{M1sc0nf1g_Env_F1l3_Exp0sed_Pr0d_S3cr3ts}

ADMIN_EMAIL=admin@ctf.internal
SMTP_PASS=smtp_p4ss_2025
`);
});

// Backup config also exposed
router.get('/config.bak', (req, res) => {
  console.log(`[LEVEL5] config.bak accessed from ${req.ip}`);
  res.type('text/plain');
  res.send(`# BACKUP CONFIG — system snapshot 2025-01-15
# Same secrets as .env — see .env for CTF flag
DB_HOST=10.0.0.5
DB_USER=ctfadmin
INTERNAL_NOTE=primary secrets are in .env
`);
});

// Git config exposed (bonus path)
router.get('/.git/config', (req, res) => {
  res.type('text/plain');
  res.send(`[core]
\trepositoryformatversion = 0
\tfilemode = true
[remote "origin"]
\turl = git@github.com:internal/ctf-prod.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
`);
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{M1sc0nf1g_Env_F1l3_Exp0sed_Pr0d_S3cr3ts}') {
    req.session.ctf.solvedLevels.push(5);
    req.session.ctf.currentLevel = 6;
    return res.json({ success: true, message: 'ENVIRONMENT COMPROMISED. ALL SECRETS EXPOSED.', flavour: "A file left in the wrong place handed you the kingdom. Carelessness is a vulnerability too. Next: what if authentication itself can be forged? Tokens lie when you know the right words.", nextLevel: '/level6' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
