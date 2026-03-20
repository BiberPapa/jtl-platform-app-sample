#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_TERMINOLOGY_PATH = "docs/terminology/terminology.json";
const DEFAULT_SCAN_DIRS = ["apps/frontend/src"];

const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
]);

const IGNORE_FILE_PATTERNS = [/\.test\./i, /\.spec\./i, /\.d\.ts$/i];

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  "storybook-static",
]);

function parseArgs(argv) {
  const args = {
    terminologyPath: DEFAULT_TERMINOLOGY_PATH,
    scanDirs: [],
    includeEnglish: true,
    includeGerman: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--terminology" && argv[i + 1]) {
      args.terminologyPath = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--dir" && argv[i + 1]) {
      args.scanDirs.push(argv[i + 1]);
      i += 1;
      continue;
    }

    if (arg === "--de-only") {
      args.includeEnglish = false;
      continue;
    }

    if (arg === "--en-only") {
      args.includeGerman = false;
      continue;
    }
  }

  if (args.scanDirs.length === 0) {
    args.scanDirs = DEFAULT_SCAN_DIRS.filter((dir) => fs.existsSync(dir));
  }

  return args;
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeEntries(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.entries)) return data.entries;
  throw new Error("Unsupported terminology JSON shape. Expected array or { entries: [...] }.");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldUseWordBoundaries(term) {
  return /^[\p{L}\p{N}_ -]+$/u.test(term);
}

function makeRegex(term) {
  const escaped = escapeRegExp(term);
  if (shouldUseWordBoundaries(term)) {
    return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "giu");
  }
  return new RegExp(escaped, "giu");
}

function buildForbiddenIndex(entries, { includeGerman, includeEnglish }) {
  const result = [];

  for (const entry of entries) {
    if (includeGerman && entry?.de?.forbidden_synonyms?.length) {
      for (const forbidden of entry.de.forbidden_synonyms) {
        if (!forbidden || typeof forbidden !== "string") continue;
        result.push({
          language: "de",
          forbidden,
          canonical: entry?.de?.term ?? null,
          english: entry?.en?.term ?? null,
          entryId: entry?.id ?? null,
          product: entry?.product_context?.primary_product ?? null,
          module: entry?.product_context?.module ?? null,
          uiPath: entry?.product_context?.ui?.path ?? null,
          regex: makeRegex(forbidden),
        });
      }
    }

    if (includeEnglish && entry?.en?.forbidden_synonyms?.length) {
      for (const forbidden of entry.en.forbidden_synonyms) {
        if (!forbidden || typeof forbidden !== "string") continue;
        result.push({
          language: "en",
          forbidden,
          canonical: entry?.en?.term ?? null,
          german: entry?.de?.term ?? null,
          entryId: entry?.id ?? null,
          product: entry?.product_context?.primary_product ?? null,
          module: entry?.product_context?.module ?? null,
          uiPath: entry?.product_context?.ui?.path ?? null,
          regex: makeRegex(forbidden),
        });
      }
    }
  }

  return result;
}

function walkFiles(rootDir, out = []) {
  if (!fs.existsSync(rootDir)) return out;

  const stat = fs.statSync(rootDir);
  if (stat.isFile()) {
    const ext = path.extname(rootDir).toLowerCase();
    if (SCAN_EXTENSIONS.has(ext)) out.push(rootDir);
    return out;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walkFiles(fullPath, out);
      continue;
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SCAN_EXTENSIONS.has(ext)) out.push(fullPath);
    }
  }

  return out;
}

function shouldIgnoreFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");

  if (normalizedPath === DEFAULT_TERMINOLOGY_PATH) {
    return true;
  }

  return IGNORE_FILE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function getLineAndColumn(text, index) {
  const before = text.slice(0, index);
  const lines = before.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function isLikelyImportLike(source, startIndex) {
  const prefix = source.slice(Math.max(0, startIndex - 30), startIndex);
  return /\b(from|import|require)\s*$/u.test(prefix) || /import\(\s*$/u.test(prefix);
}

function isLikelyUserVisibleText(value) {
  const normalized = value.trim();

  if (normalized.length < 2) return false;
  if (!/[\p{L}]/u.test(normalized)) return false;
  if (/^[\p{Ll}\d-]+$/u.test(normalized)) return false;
  if (/^[./@#_-a-z0-9]+$/iu.test(normalized)) return false;
  if (/^[A-Z0-9_.-]+$/u.test(normalized)) return false;
  if (/^(https?:|data:|mailto:)/iu.test(normalized)) return false;
  if (/[\\/]/u.test(normalized)) return false;

  return true;
}

function decodeLiteral(raw, quote) {
  if (quote === "`" && raw.includes("${")) {
    return null;
  }

  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function extractStringFragments(content) {
  const fragments = [];
  const stringRegex = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/gmu;
  let match;

  while ((match = stringRegex.exec(content)) !== null) {
    const [fullMatch, quote, rawValue] = match;
    if (isLikelyImportLike(content, match.index)) {
      continue;
    }

    const value = decodeLiteral(rawValue, quote);
    if (!value || !isLikelyUserVisibleText(value)) {
      continue;
    }

    fragments.push({
      text: value,
      startIndex: match.index + 1,
      endIndex: match.index + fullMatch.length - 1,
    });
  }

  return fragments;
}

function extractJsxTextFragments(content) {
  const fragments = [];
  const jsxTextRegex = />([^<>{]+)</gmu;
  let match;

  while ((match = jsxTextRegex.exec(content)) !== null) {
    const rawValue = match[1];
    const value = rawValue.replace(/\s+/g, " ").trim();
    if (!isLikelyUserVisibleText(value)) {
      continue;
    }

    const offset = match[0].indexOf(rawValue);
    fragments.push({
      text: value,
      startIndex: match.index + offset,
      endIndex: match.index + offset + rawValue.length,
    });
  }

  return fragments;
}

function extractCandidateText(content, filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(extension)) {
    return [...extractStringFragments(content), ...extractJsxTextFragments(content)];
  }

  return [{ text: content, startIndex: 0, endIndex: content.length }];
}

function scanFile(filePath, forbiddenIndex) {
  const content = fs.readFileSync(filePath, "utf8");
  const candidates = extractCandidateText(content, filePath);
  const findings = [];

  for (const candidate of candidates) {
    for (const rule of forbiddenIndex) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(candidate.text)) !== null) {
        const { line, column } = getLineAndColumn(content, candidate.startIndex + match.index);
        findings.push({
          filePath,
          line,
          column,
          matchText: match[0],
          language: rule.language,
          forbidden: rule.forbidden,
          canonical: rule.canonical,
          german: rule.german ?? null,
          english: rule.english ?? null,
          entryId: rule.entryId,
          product: rule.product,
          module: rule.module,
          uiPath: rule.uiPath,
        });

        if (match.index === rule.regex.lastIndex) {
          rule.regex.lastIndex += 1;
        }
      }
    }
  }

  return findings;
}

function printFinding(finding) {
  const contextParts = [];
  if (finding.product) contextParts.push(`product=${finding.product}`);
  if (finding.module) contextParts.push(`module=${finding.module}`);
  if (finding.uiPath) contextParts.push(`ui="${finding.uiPath}"`);

  const suggestion =
    finding.language === "de"
      ? `Bevorzugt: "${finding.canonical ?? "N/A"}"`
      : `Preferred: "${finding.canonical ?? "N/A"}"`;

  console.error(
    [
      `${finding.filePath}:${finding.line}:${finding.column}`,
      `forbidden term "${finding.matchText}"`,
      suggestion,
      finding.entryId ? `entry=${finding.entryId}` : null,
      contextParts.length > 0 ? `[${contextParts.join(", ")}]` : null,
    ]
      .filter(Boolean)
      .join("  "),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.terminologyPath)) {
    console.error(`Terminology file not found: ${args.terminologyPath}`);
    process.exit(2);
  }

  const data = loadJson(args.terminologyPath);
  const entries = normalizeEntries(data);
  const forbiddenIndex = buildForbiddenIndex(entries, args);

  const files = args.scanDirs.flatMap((dir) => walkFiles(dir)).filter((filePath) => !shouldIgnoreFile(filePath));
  const allFindings = files.flatMap((filePath) => scanFile(filePath, forbiddenIndex));

  if (allFindings.length === 0) {
    console.log("No forbidden terminology found.");
    process.exit(0);
  }

  console.error(`Found ${allFindings.length} forbidden terminology occurrence(s):`);
  for (const finding of allFindings) {
    printFinding(finding);
  }

  process.exit(1);
}

main();
