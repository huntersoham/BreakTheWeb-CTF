const express = require('express');
const router = express.Router();
const path = require('path');

// ─────────────────────────────────────────────────────────────────
// LEVEL 1: "The Forgotten Door"
// Vulnerability: IDOR (Insecure Direct Object Reference)
// 
// Concept: The platform assigns each visitor a numeric user ID
// stored in a cookie. The /api/profile endpoint fetches that
// user's data — but NEVER verifies that you OWN that ID.
// Admin user (ID=1) holds the flag. Default visitors get ID=1000+.
// Player must intercept the request (Burp/DevTools), change their
// user_id cookie to 1, and the flag is returned in the API response.
// The flag is NEVER rendered on the page — only in the JSON response.
// ─────────────────────────────────────────────────────────────────

// Simulated user database
const USERS = {
  1: {
    id: 1,
    username: 'sys_admin',
    role: 'administrator',
    email: 'admin@ctf.internal',
    flag: 'FLAG{1D0R_4cc3ss_Gr4nt3d_Y0u_Ar3_N0t_4uth0r1z3d}',
    note: 'Restricted profile. Access logged.'
  },
  2: {
    id: 2,
    username: 'dev_jenkins',
    role: 'developer',
    email: 'jenkins@ctf.internal',
    note: 'Nothing to see here.'
  },
  3: {
    id: 3,
    username: 'intern_01',
    role: 'readonly',
    email: 'intern@ctf.internal',
    note: 'Intern account. No permissions.'
  }
};

// Assign a fresh user_id cookie to new visitors (high number = regular user)
router.use((req, res, next) => {
  if (!req.cookies.user_id) {
    const assignedId = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
    res.cookie('user_id', String(assignedId), {
      httpOnly: false, // Intentionally readable by JS — part of the puzzle
      sameSite: 'lax'
    });
    req.currentUserId = assignedId;
  } else {
    req.currentUserId = parseInt(req.cookies.user_id, 10);
  }
  next();
});

// Serve the level 1 HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── VULNERABLE ENDPOINT ──────────────────────────────────────────
// This is the IDOR hole. It reads user_id from cookie without
// verifying it matches the authenticated session owner.
router.get('/api/profile', (req, res) => {
  const requestedId = parseInt(req.cookies.user_id, 10);

  // Intentional: NO authorization check. Just look up by cookie value.
  const user = USERS[requestedId];

  if (!user) {
    // Return a "regular user" profile stub for unknown IDs
    return res.json({
      id: requestedId,
      username: `user_${requestedId}`,
      role: 'guest',
      email: `user${requestedId}@ctf-users.io`,
      note: 'Standard account. No special access.'
    });
  }

  // Log access (visible in server console — adds realism)
  console.log(`[LEVEL1] Profile accessed: user_id=${requestedId}, role=${user.role}`);

  // Return full profile — flag included for admin (ID=1)
  return res.json(user);
});

// ── FLAG SUBMISSION ──────────────────────────────────────────────
router.post('/api/submit', (req, res) => {
  const { flag } = req.body;
  const CORRECT_FLAG = 'FLAG{1D0R_4cc3ss_Gr4nt3d_Y0u_Ar3_N0t_4uth0r1z3d}';

  if (!flag || typeof flag !== 'string') {
    return res.status(400).json({ success: false, message: 'No flag provided.' });
  }

  if (flag.trim() === CORRECT_FLAG) {
    // Unlock level 2
    req.session.ctf.solvedLevels.push(1);
    req.session.ctf.currentLevel = 2;

    return res.json({
      success: true,
      message: `ACCESS GRANTED. You found what wasn't meant for you.`,
      flavour: `The system trusted a number. You changed it. Simple, devastating. But what if the system doesn't just trust what you carry — what if it trusts what you SAY? Next level awaits. "The input box looks innocent. It always does."`,
      nextLevel: '/level2'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Incorrect flag. The door remains closed.'
  });
});

module.exports = router;
