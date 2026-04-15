// LEVEL 7 — "THE SILENT PARAMETER"
// Vulnerability: Mass Assignment / Insecure Design (OWASP A04:2021)
// User registration endpoint blindly assigns ALL body fields to user object.
// Player must send { username, password, role: "admin" } during registration.
// The extra "role" field gets applied, granting admin. Then login → /api/profile returns flag.

const express = require('express');
const router = express.Router();
const path = require('path');

const users = {}; // username → user object

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// VULNERABLE: spreads entire req.body into user object — mass assignment
router.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  if (users[username]) return res.status(409).json({ error: 'Username taken.' });

  // VULNERABILITY: Object.assign blindly copies all body fields including role, isAdmin, etc.
  const newUser = Object.assign({ role: 'user', isAdmin: false, createdAt: Date.now() }, req.body);
  users[username] = newUser;

  console.log(`[LEVEL7] Registered user: ${username}, role=${newUser.role}, isAdmin=${newUser.isAdmin}`);
  return res.json({ success: true, username, role: newUser.role, message: 'Account created.' });
});

router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  req.session.level7User = username;
  console.log(`[LEVEL7] Login: ${username}, role=${user.role}`);
  res.json({ success: true, username, role: user.role });
});

router.get('/api/profile', (req, res) => {
  const username = req.session.level7User;
  if (!username) return res.status(401).json({ error: 'Not logged in.' });
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (user.role === 'admin' || user.isAdmin === true || user.isAdmin === 'true') {
    return res.json({
      username: user.username,
      role: user.role,
      isAdmin: user.isAdmin,
      flag: 'FLAG{M4ss_4ss1gnm3nt_R0l3_3sc4l4t10n_0wn3d}',
      adminNote: 'You escalated yourself. The server never checked what it was trusting.'
    });
  }

  return res.json({
    username: user.username,
    role: user.role,
    isAdmin: user.isAdmin,
    message: 'Standard user profile. Nothing to see here.'
  });
});

router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  if (flag && flag.trim() === 'FLAG{M4ss_4ss1gnm3nt_R0l3_3sc4l4t10n_0wn3d}') {
    req.session.ctf.solvedLevels.push(7);
    req.session.ctf.currentLevel = 8;
    return res.json({ success: true, message: 'PRIVILEGE ESCALATED VIA REGISTRATION.', flavour: "The form asked for two fields. You gave it three. The server accepted all of them. Next: redirects look innocent — until they redirect somewhere you control.", nextLevel: '/level8' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect flag.' });
});

module.exports = router;
