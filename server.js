const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ctf_secret_s3ss10n_k3y_2025',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));
app.use((req, res, next) => {
  if (!req.session.ctf) {
    req.session.ctf = { currentLevel: 1, solvedLevels: [], hintsUsed: 0, totalHintsAllowed: 4 };
  }
  next();
});
for (let i = 1; i <= 10; i++) {
  try {
    const routes = require('./levels/level' + i + '/routes');
    app.use('/level' + i, routes);
  } catch(e) { console.warn('Level ' + i + ' routes not found'); }
}
const hintData = require('./hints');
app.post('/api/hint', (req, res) => {
  const { level, hintNumber } = req.body;
  const ctf = req.session.ctf;
  if (ctf.hintsUsed >= ctf.totalHintsAllowed) {
    return res.status(403).json({ error: 'HINT_LIMIT_REACHED', message: 'You have exhausted your 4 global hints.' });
  }
  const levelHints = hintData['level' + level];
  if (!levelHints || !levelHints[hintNumber - 1]) return res.status(404).json({ error: 'Hint not found.' });
  ctf.hintsUsed++;
  return res.json({ hint: levelHints[hintNumber - 1], hintsRemaining: ctf.totalHintsAllowed - ctf.hintsUsed });
});
app.get('/api/status', (req, res) => {
  res.json({ currentLevel: req.session.ctf.currentLevel, solvedLevels: req.session.ctf.solvedLevels, hintsRemaining: req.session.ctf.totalHintsAllowed - req.session.ctf.hintsUsed });
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚩 CTF Platform running at http://localhost:' + PORT);
  for (let i = 1; i <= 10; i++) console.log('   Level ' + i + ' → http://localhost:' + PORT + '/level' + i);
});
