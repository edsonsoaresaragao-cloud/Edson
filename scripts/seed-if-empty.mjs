import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { spawnSync } from "node:child_process";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
let empty = false;
try {
  const [categories, content] = await Promise.all([
    db.category.count(),
    db.content.count(),
  ]);
  empty = categories === 0 && content === 0;
} finally {
  await db.$disconnect();
}
if (empty) {
  const result = spawnSync("npm", ["run", "db:seed"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else
  console.log(
    "Banco já contém dados; inicialização preservou os registros existentes.",
  );
