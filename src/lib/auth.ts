import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { createHash, randomBytes } from "node:crypto";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new AppError(
      "SESSION_SECRET precisa ser configurado com pelo menos 32 caracteres.",
      503,
    );
  return new TextEncoder().encode(value);
}
export async function currentUser() {
  const token = (await cookies()).get("edson_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "edson-oficina",
      audience: "portal",
    });
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sessionVersion: true,
      },
    });
    return user && user.sessionVersion === payload.v ? user : null;
  } catch {
    return null;
  }
}
export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new AppError("Entre na sua conta para continuar.", 401);
  return u;
}
export async function requireEditor() {
  const u = await requireUser();
  if (!["ADMIN", "EDITOR"].includes(u.role))
    throw new AppError("Acesso restrito à equipe editorial.", 403);
  return u;
}
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN")
    throw new AppError("Acesso restrito ao administrador.", 403);
  return u;
}
export async function setSession(user: { id: string; sessionVersion: number }) {
  const token = await new SignJWT({ v: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("edson-oficina")
    .setAudience("portal")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
  (await cookies()).set("edson_session", token, {
    httpOnly: true,
    secure: process.env.APP_URL?.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
  });
}
export async function clearSession() {
  (await cookies()).delete("edson_session");
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const now = new Date();
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" (key,count,"expiresAt") VALUES (${key},1,${new Date(now.getTime() + seconds * 1000)}) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit".count+1 END,"expiresAt"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${new Date(now.getTime() + seconds * 1000)} ELSE "RateLimit"."expiresAt" END RETURNING count`;
  if (rows[0].count > limit)
    throw new AppError(
      "Muitas tentativas. Aguarde antes de tentar novamente.",
      429,
    );
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || "http://localhost:3000")
    .origin;
  if (origin !== expected)
    throw new AppError("Origem da solicitação não autorizada.", 403);
}
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export async function audit(actorId: string, action: string, target: string) {
  await db.audit.create({ data: { actorId, action, target } });
}
