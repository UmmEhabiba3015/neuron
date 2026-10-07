import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { portableFontCss } from "../scripts/portable-fonts.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(directory, "index.source.html");
const exportPath = join(directory, "index.html");
const lockPath = join(directory, "..", "lock.css");
const runtimeCssPath = join(directory, "components", "journal-components.css");
const runtimeJsPath = join(directory, "components", "journal-components.js");
const cssBundlePath = join(directory, "components", "journal-components.bundle.css");

if (!existsSync(sourcePath)) {
  if (!existsSync(exportPath)) throw new Error("Missing design-system source HTML.");
  renameSync(exportPath, sourcePath);
}

const normalize = (value) => value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const source = normalize(readFileSync(sourcePath, "utf8"));
const lock = normalize(readFileSync(lockPath, "utf8")).trimEnd();
const runtimeCss = normalize(readFileSync(runtimeCssPath, "utf8")).trimEnd();
const runtimeJs = normalize(readFileSync(runtimeJsPath, "utf8")).trimEnd();

if (lock.includes("</style>")) throw new Error("lock.css contains a closing style tag.");
if (runtimeCss.includes("</style>")) throw new Error("Runtime CSS contains a closing style tag.");
if (runtimeJs.includes("</script>")) throw new Error("Runtime JavaScript contains a closing script tag.");

function findBrace(input, start, closing = false) {
  let depth = closing ? 1 : 0;
  let quote = null;
  for (let index = start; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (!quote && char === "/" && next === "*") {
      const end = input.indexOf("*/", index + 2);
      if (end < 0) throw new Error("Unclosed CSS comment.");
      index = end + 1;
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (!closing && char === "{") return index;
    if (closing && char === "{") depth += 1;
    if (closing && char === "}" && --depth === 0) return index;
  }
  return -1;
}

function splitLeadingTrivia(prelude) {
  let index = 0;
  while (index < prelude.length) {
    if (/\s/.test(prelude[index])) { index += 1; continue; }
    if (prelude[index] === "/" && prelude[index + 1] === "*") {
      const end = prelude.indexOf("*/", index + 2);
      if (end < 0) throw new Error("Unclosed CSS comment.");
      index = end + 2;
      continue;
    }
    break;
  }
  return [prelude.slice(0, index), prelude.slice(index).trim()];
}

function splitSelectors(selectors) {
  const result = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  for (let index = 0; index < selectors.length; index += 1) {
    const char = selectors[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    else if (char === "," && depth === 0) { result.push(selectors.slice(start, index)); start = index + 1; }
  }
  result.push(selectors.slice(start));
  return result;
}

function scopeSelectors(selectors) {
  return splitSelectors(selectors).map((value) => {
    const selector = value.trim();
    if (selector === ":root" || selector === "html" || selector === "body") return ".journal-app";
    if (selector === "*") return ".journal-app, .journal-app *";
    if (selector.startsWith(".journal-app")) return selector;
    return `.journal-app ${selector}`;
  }).join(",");
}

function scopeCss(input) {
  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const open = findBrace(input, cursor);
    if (open < 0) return output + input.slice(cursor);
    const close = findBrace(input, open + 1, true);
    if (close < 0) throw new Error("Unclosed CSS block.");
    const [trivia, rule] = splitLeadingTrivia(input.slice(cursor, open));
    const body = input.slice(open + 1, close);
    output += trivia;
    if (rule.startsWith("@media") || rule.startsWith("@supports") || rule.startsWith("@container") || rule.startsWith("@layer")) {
      output += `${rule}{${scopeCss(body)}}`;
    } else if (rule.startsWith("@")) {
      output += `${rule}{${body}}`;
    } else {
      output += `${scopeSelectors(rule)}{${body}}`;
    }
    cursor = close + 1;
  }
  return output;
}

const stylesheetLinks = '<link rel="stylesheet" href="../lock.css">\n<link rel="stylesheet" href="components/journal-components.css">';
const sourceMount = /<script type="module">\s*import \{ mountJournalComponents \} from "\.\/components\/journal-components\.js";\s*mountJournalComponents\(document\);\s*<\/script>/;

if (!source.includes(stylesheetLinks)) throw new Error("Could not find the source stylesheet links.");
if (!sourceMount.test(source)) throw new Error("Could not find the source runtime mount.");

const presentationStart = lock.indexOf("/* ---- 2.1 The presentation stage.");
const focusStart = lock.indexOf("/* ---- 2.2 Focus.");
if (presentationStart < 0 || focusStart < 0 || focusStart <= presentationStart) {
  throw new Error("Could not isolate the prototype-only presentation furniture.");
}
const tokenStart = lock.indexOf(":root{");
if (tokenStart < 0 || tokenStart >= presentationStart) throw new Error("Could not find the token block.");
const applicationCss = portableFontCss + "\n" + lock.slice(tokenStart, presentationStart) + lock.slice(focusStart);
const embeddedCss = `${lock}\n\n${runtimeCss}\n`;
const bundledCss = `/* Generated application bundle. Prototype furniture is removed; all rules are scoped beneath .journal-app. */\n${scopeCss(`${applicationCss}\n\n${runtimeCss}`)}\n`;
const generatedBanner = "<!-- GENERATED by build-export.mjs. Edit index.source.html, lock.css, or component source files, then rebuild. -->";
const inlinedStyles = `<style data-journal-export-styles>\n${embeddedCss}</style>`;
const inlinedRuntime = `<script type="module" data-journal-export-runtime>\n${runtimeJs}\n\nmountJournalComponents(document);\n</script>`;

const exportedHtml = source
  .replace("<!doctype html>", `<!doctype html>\n${generatedBanner}`)
  .replace(stylesheetLinks, inlinedStyles)
  .replace(sourceMount, inlinedRuntime);

const dependencyProbe = exportedHtml
  .replace(/<style\b[\s\S]*?<\/style>/gi, "")
  .replace(/<script\b[\s\S]*?<\/script>/gi, "");
if (/<link\b[^>]*rel=["']stylesheet|<script\b[^>]*src=|<(?:img|source)\b[^>]*src=/i.test(dependencyProbe)) {
  throw new Error("Generated HTML still contains an external asset dependency.");
}

writeFileSync(cssBundlePath, bundledCss, "utf8");
writeFileSync(exportPath, exportedHtml, "utf8");

// Keep editable module source and generate a test that also opens via file://.
const testSourcePath = join(directory, "components", "tests", "runtime.source.html");
const testExportPath = join(directory, "components", "tests", "runtime.html");
const testSource = normalize(readFileSync(testSourcePath, "utf8"));
const testImport = /import \{[\s\S]*?\} from "\.\.\/journal-components\.js";/;
if (!testImport.test(testSource)) throw new Error("Missing runtime test import seam.");
const testExport = testSource
  .replace("<!doctype html>", "<!doctype html>\n<!-- GENERATED by design system/build-export.mjs from runtime.source.html. -->")
  .replace('<link rel="stylesheet" href="../journal-components.bundle.css">', () => `<style>\n${bundledCss}\n</style>`)
  .replace(testImport, () => runtimeJs);
writeFileSync(testExportPath, testExport, "utf8");

console.log(`Built ${exportPath}`);
console.log(`Built ${cssBundlePath}`);
console.log(`Built ${testExportPath}`);
