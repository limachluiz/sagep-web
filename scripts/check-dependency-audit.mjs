import { spawnSync } from "node:child_process";

// The shadcn package is required at build time by `shadcn/tailwind.css`.
// Its current release has no compatible fix for this tooling-only chain, so
// pin the exact advisory/dependency graph and continue rejecting new findings.
const allowedFindings = new Map([
  ["braces", { severity: "high", sources: new Set([1240992]) }],
  ["micromatch", { severity: "high", dependencies: new Set(["braces"]) }],
  ["fast-glob", { severity: "high", dependencies: new Set(["micromatch"]) }],
  ["@shadcn/registry", { severity: "high", dependencies: new Set(["fast-glob"]) }],
  ["@ts-morph/common", { severity: "high", dependencies: new Set(["fast-glob"]) }],
  ["ts-morph", { severity: "high", dependencies: new Set(["@ts-morph/common"]) }],
  ["shadcn", { severity: "high", dependencies: new Set(["@shadcn/registry", "fast-glob", "ts-morph"]) }],
]);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error || !result.stdout.trim()) {
  console.error("Não foi possível executar o npm audit.");
  console.error(result.error?.message ?? result.stderr);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("O npm audit não retornou um relatório JSON válido.");
  process.exit(1);
}

const unexpected = [];
const accepted = [];
for (const [name, finding] of Object.entries(report.vulnerabilities ?? {})) {
  const rule = allowedFindings.get(name);
  const references = Array.isArray(finding.via) ? finding.via : [];
  const sources = references.filter((reference) => typeof reference === "object" && reference !== null).map((reference) => reference.source);
  const dependencies = references.filter((reference) => typeof reference === "string");
  const matches = rule && finding.severity === rule.severity && sources.length + dependencies.length > 0
    && sources.every((source) => rule.sources?.has(source))
    && dependencies.every((dependency) => rule.dependencies?.has(dependency));
  (matches ? accepted : unexpected).push(`${name} (${finding.severity})`);
}

if (unexpected.length > 0) {
  console.error(`Vulnerabilidades não autorizadas: ${unexpected.join(", ")}`);
  process.exit(1);
}

if (accepted.length > 0) console.warn(`Exceções documentadas: ${accepted.join(", ")}`);

console.log("Auditoria de dependências concluída sem novos alertas.");
