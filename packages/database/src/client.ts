import { randomUUID } from "node:crypto";
import { mkdir, rename, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";
import { sqliteInitialMigrationId, sqliteInitialMigrationStatements } from "./migrations/sqlite";

export interface DatabaseLogger {
  info?: (message: string, details?: unknown) => void;
  warn?: (message: string, details?: unknown) => void;
  error?: (message: string, details?: unknown) => void;
}

export interface LocalDatabaseOptions {
  sqlitePath?: string;
  databaseUrl?: string;
  logger?: DatabaseLogger;
}

export interface InitializedDatabase {
  prisma: PrismaClient;
  databaseUrl: string;
  sqlitePath: string | null;
}

function normalizeSqlitePath(path: string): string {
  const absolutePath = isAbsolute(path) ? path : resolve(process.cwd(), path);
  return absolutePath.replace(/\\/g, "/");
}

export function sqlitePathToDatabaseUrl(path: string): string {
  return `file:${normalizeSqlitePath(path)}`;
}

function sqlitePathFromDatabaseUrl(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }
  return databaseUrl.slice("file:".length);
}

function createClient(databaseUrl: string): PrismaClient {
  process.env.DATABASE_URL = databaseUrl;
  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl
  });
  return new PrismaClient({
    adapter,
    errorFormat: "minimal"
  });
}

function isLikelySqliteCorruption(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("database disk image is malformed") ||
    message.includes("file is not a database") ||
    message.includes("sqlite_corrupt") ||
    message.includes("sqlite_notadb")
  );
}

async function safeRenameCorruptDatabase(sqlitePath: string, logger?: DatabaseLogger): Promise<void> {
  try {
    await stat(sqlitePath);
  } catch {
    return;
  }

  const backupPath = `${sqlitePath}.corrupt-${Date.now()}-${randomUUID().slice(0, 8)}.bak`;
  await rename(sqlitePath, backupPath);
  logger?.warn?.("SQLite database looked corrupt; moved it aside and created a fresh database.", {
    originalPath: sqlitePath,
    backupPath
  });
}

async function applyInitialMigration(prisma: PrismaClient, logger?: DatabaseLogger): Promise<void> {
  for (const statement of sqliteInitialMigrationStatements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await prisma.localMigration.upsert({
    where: { id: sqliteInitialMigrationId },
    update: {},
    create: { id: sqliteInitialMigrationId }
  });

  logger?.info?.("Local SQLite schema is ready.", {
    migrationId: sqliteInitialMigrationId
  });
}

async function ensureDatabaseReady(prisma: PrismaClient, logger?: DatabaseLogger): Promise<void> {
  await prisma.$connect();
  await applyInitialMigration(prisma, logger);
}

export async function initializeLocalDatabase(options: LocalDatabaseOptions = {}): Promise<InitializedDatabase> {
  const databaseUrl = options.databaseUrl ?? sqlitePathToDatabaseUrl(options.sqlitePath ?? "./data/v01.db");
  const sqlitePath = sqlitePathFromDatabaseUrl(databaseUrl);

  if (sqlitePath) {
    await mkdir(dirname(sqlitePath), { recursive: true });
  }

  let prisma = createClient(databaseUrl);
  try {
    await ensureDatabaseReady(prisma, options.logger);
  } catch (error) {
    if (!sqlitePath || !isLikelySqliteCorruption(error)) {
      await prisma.$disconnect().catch(() => undefined);
      throw error;
    }

    await prisma.$disconnect().catch(() => undefined);
    await safeRenameCorruptDatabase(sqlitePath, options.logger);
    prisma = createClient(databaseUrl);
    await ensureDatabaseReady(prisma, options.logger);
  }

  return {
    prisma,
    databaseUrl,
    sqlitePath
  };
}
