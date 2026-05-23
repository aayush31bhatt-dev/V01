import { buildApp } from "./app";
import { env } from "./env";

const app = await buildApp();

await app.listen({
  host: env.apiHost,
  port: env.apiPort
});

