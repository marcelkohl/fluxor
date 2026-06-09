export {
  checkDatabaseConnection,
  closePool,
  getPool,
  isDatabaseConfigured,
} from "./adapters/mariadb/connection.js";
export { NotImplementedError } from "./errors/not-implemented.error.js";
export type {
  CategoryRepositoryPort,
  FinancialRecordRepositoryPort,
  PayeeRepositoryPort,
  WalletRepositoryPort,
} from "./ports/index.js";
export { createMariadbPersistenceProvider } from "./providers/mariadb-persistence.provider.js";
export type { PersistenceProvider } from "./providers/persistence-provider.types.js";
