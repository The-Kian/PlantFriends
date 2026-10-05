/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
// Builds hosting/privacy.html from docs/PRIVACY_POLICY.md. Runs before every
// `firebase deploy --only hosting` (see firebase.json), so the hosted policy
// always matches the markdown. Handles the subset of markdown the policy uses:
// headings, paragraphs, bullet lists, **bold** and _italic_.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const md = fs.readFileSync(path.join(root, "docs/PRIVACY_POLICY.md"), "utf8");

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  escape(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\W)_(.+?)_(?=\W|$)/g, "$1<em>$2</em>")
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');

const html = [];
for (const block of md.trim().split(/\n\s*\n/)) {
  const lines = block.split("\n");
  const heading = lines[0].match(/^(#{1,3}) (.*)/);
  if (heading) {
    const level = heading[1].length;
    html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
  } else if (lines.every((l) => /^[-*] /.test(l) || /^\s+\S/.test(l))) {
    const items = block
      .split(/\n(?=[-*] )/)
      .map((i) => i.replace(/^[-*] /, ""));
    html.push(
      `<ul>${items.map((i) => `<li>${inline(i.replace(/\n\s*/g, " "))}</li>`).join("")}</ul>`
    );
  } else {
    html.push(`<p>${inline(lines.join(" "))}</p>`);
  }
}

const page = fs
  .readFileSync(path.join(root, "hosting/_layout.html"), "utf8")
  .replace("{{title}}", "Privacy Policy · Plant Friends")
  .replace("{{content}}", html.join("\n"));
fs.writeFileSync(path.join(root, "hosting/privacy.html"), page);
console.log("Wrote hosting/privacy.html");
