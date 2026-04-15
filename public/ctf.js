// VULN/CTF — Shared utilities

async function fetchStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    const el = document.getElementById('nav-hints');
    if (el) el.textContent = d.hintsRemaining;
    const solved = document.getElementById('nav-solved');
    const lvl = parseInt(document.body.dataset.level || '0');
    if (solved && lvl && d.solvedLevels.includes(lvl)) solved.style.display = 'block';
  } catch(e){}
}

async function submitFlag(levelNum, correctCallback) {
  const rawInput = document.getElementById('flag-input').value.trim();
  const flag = rawInput.startsWith('FLAG{') ? rawInput : 'FLAG{' + rawInput;
  const fb = document.getElementById('feedback');
  fb.className = ''; fb.style.display = 'none';
  try {
    const r = await fetch('/level' + levelNum + '/api/submit', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ flag })
    });
    const d = await r.json();
    if (d.success) {
      fb.className = 'success';
      fb.innerHTML = '<strong>✓ ' + d.message + '</strong>'
        + '<div class="flavour-text">' + d.flavour + '</div>'
        + (d.nextLevel ? '<a class="next-link" href="' + d.nextLevel + '">→ PROCEED TO NEXT LEVEL</a>' : '')
        + (d.complete ? '<div style="margin-top:12px;color:var(--amber);letter-spacing:2px">🏁 CTF COMPLETE</div>' : '');
      const solved = document.getElementById('nav-solved');
      if (solved) solved.style.display = 'block';
      if (correctCallback) correctCallback(d);
    } else {
      fb.className = 'error';
      fb.textContent = '✗ ' + d.message;
    }
  } catch(e) {
    fb.className = 'error'; fb.textContent = '✗ Request failed.';
  }
  fb.style.display = 'block';
}

function toggleHintPanel() {
  document.getElementById('hint-body').classList.toggle('open');
}

async function getHint(level, n) {
  const ht = document.getElementById('hint-text');
  ht.style.display = 'block'; ht.textContent = 'Decrypting...';
  try {
    const r = await fetch('/api/hint', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ level, hintNumber: n })
    });
    const d = await r.json();
    if (d.error === 'HINT_LIMIT_REACHED') {
      ht.style.color = 'var(--red)'; ht.textContent = '⚠ ' + d.message;
    } else if (d.hint) {
      ht.style.color = '#ffd060';
      ht.textContent = '[HINT ' + n + '] ' + d.hint;
      const nh = document.getElementById('nav-hints');
      if (nh) nh.textContent = d.hintsRemaining;
      const hc = document.getElementById('hint-cost-label');
      if (hc) hc.textContent = d.hintsRemaining + ' global hints remaining';
    } else { ht.textContent = d.error || 'Unavailable.'; }
  } catch(e) { ht.textContent = 'Failed.'; }
}

function typeText(elId, html, speed=28) {
  const el = document.getElementById(elId);
  if (!el) return;
  let i = 0; let rendered = ''; let inTag = false; let tagBuffer = '';
  function step() {
    if (i >= html.length) { el.innerHTML = html; return; }
    if (html[i] === '<') inTag = true;
    if (inTag) {
      tagBuffer += html[i];
      if (html[i] === '>') { rendered += tagBuffer; tagBuffer = ''; inTag = false; }
    } else { rendered += html[i]; }
    el.innerHTML = rendered + '<span class="typed-cursor">|</span>';
    i++;
    setTimeout(step, inTag ? 0 : speed);
  }
  step();
}

function navHTML(levelNum, owasp) {
  return `<nav class="topbar">
    <a class="topbar-logo" href="/">VULN/CTF</a>
    <div class="topbar-status">
      <div class="status-item">LEVEL <span>${String(levelNum).padStart(2,'0')}</span>/10</div>
      <div class="status-item">HINTS <span class="hint-counter" id="nav-hints">4</span> LEFT</div>
      <div class="status-item" id="nav-solved" style="display:none">✓ SOLVED</div>
    </div>
  </nav>`;
}

function hintSection(levelNum) {
  return `<div>
    <div class="section-label">HINTS</div>
    <div class="hint-panel">
      <div class="hint-header" onclick="toggleHintPanel()">
        <span class="hint-title">⚠ REQUEST A HINT</span>
        <span class="hint-cost" id="hint-cost-label">Costs 1 of your 4 global hints</span>
      </div>
      <div class="hint-body" id="hint-body">
        <div class="hint-btns">
          <button class="hint-btn" onclick="getHint(${levelNum},1)">HINT 1 — VAGUE</button>
          <button class="hint-btn" onclick="getHint(${levelNum},2)">HINT 2 — DIRECTIONAL</button>
          <button class="hint-btn" onclick="getHint(${levelNum},3)">HINT 3 — NEAR REVEAL</button>
        </div>
        <div id="hint-text"></div>
      </div>
    </div>
  </div>`;
}

function flagSection(levelNum) {
  return `<div style="margin-bottom:32px">
    <div class="section-label">FLAG SUBMISSION</div>
    <div class="flag-wrap">
      <div class="flag-prefix">FLAG{</div>
      <input type="text" id="flag-input" class="ctf-input" placeholder="...paste_flag_here...}" autocomplete="off" spellcheck="false"
        onkeydown="if(event.key==='Enter') submitFlag(${levelNum})"/>
      <button class="ctf-btn" onclick="submitFlag(${levelNum})">SUBMIT</button>
    </div>
    <div id="feedback"></div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => { fetchStatus(); });
