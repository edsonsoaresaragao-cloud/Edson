import "dotenv/config";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { emailSchema, passwordSchema } from "../src/lib/validation";
async function main() {
  const email = emailSchema.parse(process.env.ADMIN_EMAIL);
  const name = process.env.ADMIN_NAME || "Edson";
  let password = process.env.ADMIN_PASSWORD;
  if (!password && process.env.ADMIN_PASSWORD_FILE)
    password = (
      await readFile(process.env.ADMIN_PASSWORD_FILE, "utf8")
    ).trimEnd();
  password = passwordSchema.parse(password);
  await db.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
    update: {
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
      sessionVersion: { increment: 1 },
    },
  });
  console.log(
    "Administrador criado/atualizado. Senha não exibida. Remova as variáveis temporárias do terminal.",
  );
}
main()
  .catch(() => {
    console.error(
      "Informe ADMIN_EMAIL e ADMIN_PASSWORD_FILE (arquivo privado) ou ADMIN_PASSWORD. Senha: 12 caracteres, máximo 72 bytes.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
