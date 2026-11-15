/**
 * firebase-admin 14 removed the namespaced API (`admin.firestore()`,
 * `admin.auth()`, `admin.credential`). The unit tests mock firebase-admin, so
 * they can't notice a call to something that no longer exists: that broke
 * every callable function in production once. Code must import firebase-admin
 * only through its modular entry points, which in practice means ./admin.js.
 */
const fs = require("fs");
const path = require("path");

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : sourceFiles(full);
    }
    return entry.name.endsWith(".js") && !entry.name.endsWith(".test.js")
      ? [full]
      : [];
  });
}

describe("firebase-admin usage", () => {
  const files = sourceFiles(__dirname);

  it("only uses the modular entry points", () => {
    const offenders = files.filter((file) => {
      // Code only: comments may mention the old API to explain the rule.
      const source = fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
        .join("\n");
      return (
        /require\(["']firebase-admin["']\)/.test(source) ||
        /\badmin\.(firestore|credential|messaging)\b/.test(source)
      );
    });
    expect(offenders.map((file) => path.relative(__dirname, file))).toEqual([]);
  });
});
