module.exports = {
  level1: [
    "Not all doors announce themselves. Some are accessed by knowing the right number.",
    "The server knows who you are by what you carry. What does your browser carry on every request?",
    "Your session has an ID. What if a different ID belonged to someone more privileged?"
  ],
  level2: [
    "The search box searches. But what else can it do if you speak its language?",
    "Databases speak SQL. What happens when your input bleeds into that language?",
    "Try ending a string early. A single quote might open a door that logic closed."
  ],
  level3: [
    "The server fetches things for you. Can you control what it fetches?",
    "Internal services don't expect visitors from the outside. But what if the request comes from inside?",
    "Try pointing the URL parameter to 127.0.0.1 instead of the internet."
  ],
  level4: [
    "The comment lives forever, even after you leave.",
    "What if your input isn't just text — what if the browser reads it as instructions?",
    "Store something the admin's browser will execute. Script tags have power."
  ],
  level5: [
    "Servers expose more than they intend. Common files are often left unguarded.",
    "Developers leave breadcrumbs: .env, .git, backup files. Try common paths.",
    "Try accessing /.env directly in the browser. Misconfiguration is a vulnerability too."
  ],
  level6: [
    "Your token proves who you are. But what if you could rewrite the proof?",
    "JWT tokens have three parts. The middle part is a claim. Claims can be changed.",
    "Decode the JWT at jwt.io. Change your role to admin. But you'll need to handle the signature..."
  ],
  level7: [
    "The API accepts only what you give it. Or does it accept more?",
    "Mass assignment: what if the server reads ALL fields you send, even ones you weren't supposed to send?",
    "Add 'role' or 'isAdmin' to your JSON body. The server might be listening."
  ],
  level8: [
    "Redirects are convenient. Too convenient.",
    "An open redirect can send users anywhere. Where does the 'next' parameter go?",
    "Combine the redirect with a parameter that controls where data gets sent."
  ],
  level9: [
    "State-changing requests should carry proof they were intentional.",
    "What if you could forge a request that the server can't distinguish from a real one?",
    "CSRF: craft a request to the action endpoint without the expected token. Does it work?"
  ],
  level10: [
    "Every previous vulnerability combined. The final door has many locks.",
    "Start with what you know: enumerate, inject, forge. Chain the steps.",
    "IDOR gives you the target. SQLi gives you the key. JWT gives you the crown."
  ]
};
