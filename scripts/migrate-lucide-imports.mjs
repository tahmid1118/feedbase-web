// One-time codemod: every icon name lucide-react exported that this project
// used is now re-exported under the identical name from
// "@/components/icons" (see components/icons/index.ts), so migrating a call
// site is purely a matter of changing the import's source string — no
// identifier in any JSX tag or import list needs to change.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
// Files under components/icons/ never import "lucide-react" (they only
// import from "./types"), so walking into that directory is harmless — the
// `!src.includes("lucide-react")` check below skips them on its own. Only
// node_modules/.next/.git are worth skipping for speed.
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

async function walk(dir, out) {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

async function main() {
  const files = [];
  await walk(ROOT, files);

  const changed = [];
  for (const file of files) {
    const src = await readFile(file, "utf8");
    if (!src.includes("lucide-react")) continue;
    const next = src
      .replace(/"lucide-react"/g, '"@/components/icons"')
      .replace(/'lucide-react'/g, "'@/components/icons'");
    if (next !== src) {
      await writeFile(file, next, "utf8");
      changed.push(path.relative(ROOT, file));
    }
  }

  console.log(`updated ${changed.length} files:`);
  for (const f of changed) console.log(`  ${f}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
