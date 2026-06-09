import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";
import { env } from "../../../config/env.js";

let pool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(env.db.host && env.db.name && env.db.user);
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    const connection = getPool();
    await connection.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
