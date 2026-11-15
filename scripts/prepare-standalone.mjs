import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
const root = join(process.cwd(), ".next", "standalone");
await mkdir(join(root, ".next"), { recursive: true });
await cp("public", join(root, "public"), { recursive: true });
// Material editorial autorizado, fora de public; original protegido pela rota.
await cp("academy-materials", join(root, "academy-materials"), {
  recursive: true,
});
// Dados editoriais são lidos no servidor, fora dos assets públicos.
const libraryData = "src/lib/academy/library/data";
try {
  await cp(libraryData, join(root, libraryData), { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await cp(
  "src/lib/academy/library/authorization.json",
  join(root, "src/lib/academy/library/authorization.json"),
);
await cp(".next/static", join(root, ".next", "static"), { recursive: true });
// Next traces local env files. Deployment artifacts must receive secrets at runtime.
for (const name of await readdir(root)) {
  if (name === ".env" || name.startsWith(".env.")) await rm(join(root, name));
}
console.log(
  "Standalone preparado com arquivos estáticos, sem arquivos de segredos.",
);
