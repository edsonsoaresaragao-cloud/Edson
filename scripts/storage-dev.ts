import "dotenv/config";
import S3rver from "s3rver";
import { mkdir } from "node:fs/promises";
const directory =
  process.env.DEV_STORAGE_DIRECTORY || "/workspace/.cache/edson-storage";
await mkdir(directory, { recursive: true });
const server = new S3rver({
  address: process.env.DEV_STORAGE_HOST || "127.0.0.1",
  port: 9000,
  directory,
  silent: true,
  allowMismatchedSignatures: false,
});
await server.run();
console.log(
  "S3 de desenvolvimento ativo na porta 9000. Credenciais S3RVER são apenas locais; não use em produção.",
);
process.on("SIGTERM", () => void server.close());
process.on("SIGINT", () => void server.close());
