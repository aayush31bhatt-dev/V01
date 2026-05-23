export interface DatabaseRuntimeConfig {
  driver: "sqlite";
  path: string;
}

export function createDatabaseRuntimeConfig(
  path = process.env.V01_SQLITE_PATH ?? "./data/v01.db"
): DatabaseRuntimeConfig {
  return {
    driver: "sqlite",
    path
  };
}

