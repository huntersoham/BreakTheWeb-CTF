<div align="center">

# 🚩 BreakTheWeb CTF

### A Hands-On Web Security CTF Platform (OWASP Top 10)

*A minimal, hacker-style training platform where each level requires exploiting a real-world vulnerability.*

</div>

---

## 🧠 About

VULN/CTF is a **practical web security learning platform** designed to simulate real-world vulnerabilities.

Instead of theory, each level forces you to:

* Understand how a vulnerability works
* Interact with APIs using DevTools or Burp Suite
* Exploit the issue to retrieve a flag

---

<img width="1920" height="1080" alt="Screenshot 2026-04-15 162344" src="https://github.com/user-attachments/assets/b76c3351-75ab-47a1-956b-d204a388b6e5" />

## 🗺 Current Levels

| Level | Vulnerability                |
| ----- | ---------------------------- |
| 1     | IDOR                         |
| 2     | SQL Injection                |
| 3     | SSRF                         |
| 4     | Stored XSS                   |
| 5     | Security Misconfiguration    |
| 6     | JWT Bypass                   |
| 7     | Mass Assignment              |
| 8     | Open Redirect                |
| 9     | CSRF                         |
| 10    | Chained Exploit (Final Boss) |

---

## 🚧 What's Next?

This is just the beginning.

Planned upgrades:

* ⚡ Intermediate-level challenges
* 💀 Advanced exploit chains
* 🧩 Real-world scenario-based labs


---

## 🚀 Setup & Run

```bash
git clone https://github.com/huntersoham/vuln-ctf-platform.git
cd vuln-ctf-platform
npm install
node server.js
```
<img width="898" height="503" alt="Screenshot 2026-04-15 162034" src="https://github.com/user-attachments/assets/1a6b4b14-1d5e-4224-8ac7-ceac9a58d333" />


Open in browser:

```bash
http://localhost:3000
```

---

## ⚙️ Requirements

* Node.js (v18 or above)
* Browser (Chrome recommended)
* DevTools or Burp Suite (for solving challenges)

---

## 📁 Project Structure

```
ctf-platform/
├── server.js
├── hints.js
├── public/
├── levels/
└── package.json
```

---

## ⚠️ Disclaimer

This project is created for **educational purposes only**.

All vulnerabilities are:

* Intentional
* Isolated
* Safe to practice

Do not use these techniques on systems without permission.

---

<div align="center">
<img width="1920" height="1080" alt="Screenshot 2026-04-15 162500" src="https://github.com/user-attachments/assets/b672c71c-592c-4644-af47-2a20c25c3283" />
  
⭐ If you like this project, consider starring it.
</div>
