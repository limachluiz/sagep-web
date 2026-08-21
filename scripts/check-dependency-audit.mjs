import { spawnSync } from "node:child_process";

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

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
if (vulnerabilities.length > 0) {
  const summary = vulnerabilities
    .map(([name, finding]) => `${name} (${finding.severity})`)
    .join(", ");
  console.error(`Vulnerabilidades encontradas: ${summary}`);
  process.exit(1);
}

console.log("Auditoria de dependências concluída sem alertas.");
