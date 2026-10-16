import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const allowed = new Set([
  "MIT",
  "Apache-2.0",
  "MIT OR Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "BlueOak-1.0.0",
  "Python-2.0",
]);
let packages = 0;
for (const [name, info] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (
    !allowed.has(info.license) ||
    info.hasInstallScript ||
    !/^https:\/\/registry\.npmjs\.org\//u.test(info.resolved) ||
    !/^sha512-/u.test(info.integrity)
  )
    throw new Error(`Unreviewed dependency metadata: ${name}`);
  packages++;
}
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (
    !/^\d+\.\d+\.\d+$/u.test(version) ||
    lock.packages[`node_modules/${name}`]?.version !== version
  )
    throw new Error(`Unpinned dependency: ${name}`);
}
const patterns = [
  new RegExp(["gh", "[pousr]", "_[A-Za-z0-9]{30,}"].join(""), "u"),
  new RegExp(["m", "fa\\.[A-Za-z0-9_-]{50,}"].join(""), "u"),
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /^DISCORD_TOKEN[ \t]*=[ \t]*[^\s#]/mu,
  new RegExp(
    ["[MN][A-Za-z0-9_-]{20,30}", "\\.[A-Za-z0-9_-]{6}", "\\.[A-Za-z0-9_-]{27,50}"].join(""),
    "u",
  ),
];
let files = 0;
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ["node_modules", ".git", ".env"].includes(entry.name) ||
      (entry.name.startsWith(".env.") && entry.name !== ".env.example")
    )
      continue;
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Unexpected symlink");
    if (entry.isDirectory()) await scan(full);
    else {
      const content = await readFile(full, "utf8");
      if (patterns.some((pattern) => pattern.test(content)))
        throw new Error(`Potential secret pattern in ${path.relative(root, full)}`);
      files++;
    }
  }
}
await scan(root);
console.log(
  `Verified ${packages} dependency license/registry/SHA-512/no-install-script records and ${files} source files for selected secret patterns. Pattern scanning is not a guarantee.`,
);
