import { createLocalPersistence, type LocalPersistence } from "@v01/database";
import { env } from "../env";

let persistencePromise: Promise<LocalPersistence> | null = null;

export function localPersistence(): Promise<LocalPersistence> {
  persistencePromise ??= createLocalPersistence({
    sqlitePath: env.sqlitePath,
    logger: console
  });
  return persistencePromise;
}
