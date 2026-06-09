import { closePool } from "../../persistence/adapters/mariadb/connection.js";
import { runMigrations } from "../migrate.js";

async function main() {
  const result = await runMigrations();

  if (result.applied.length > 0) {
    console.log(`Migrations aplicadas: ${result.applied.join(", ")}`);
  } else {
    console.log("Nenhuma migration pendente.");
  }

  if (result.skipped.length > 0) {
    console.log(`Migrations já aplicadas: ${result.skipped.join(", ")}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao aplicar migrations:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
