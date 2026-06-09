import { closePool } from "../../persistence/adapters/mariadb/connection.js";
import { getMigrationStatus } from "../migrate.js";

async function main() {
  const status = await getMigrationStatus();

  console.log(`Schema version (código): ${status.currentSchemaVersion}`);
  console.log(`Pendentes: ${status.pending.length > 0 ? status.pending.join(", ") : "(nenhuma)"}`);
  console.log("Aplicadas:");

  if (status.applied.length === 0) {
    console.log("  (nenhuma)");
    return;
  }

  for (const row of status.applied) {
    console.log(
      `  v${row.version} ${row.name} — ${row.appliedAt.toISOString()}`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao consultar status das migrations:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
