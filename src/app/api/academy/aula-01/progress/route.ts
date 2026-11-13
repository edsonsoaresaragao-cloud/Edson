import { z } from "zod";
import { cookies } from "next/headers";
import { changeProgress, StudyError } from "@/lib/academy/progress";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const schema = z
  .object({
    action: z.enum(["start", "visit", "complete"]),
    step: z.string().max(40).optional(),
    answers: z
      .record(z.string().max(40), z.number().int().min(0).max(9))
      .optional(),
  })
  .strict();
async function failure(error: unknown) {
  const { AppError } = await import("@/lib/auth");
  if (error instanceof AppError || error instanceof StudyError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return Response.json(
      { error: "Dados da atividade inválidos." },
      { status: 400 },
    );
  console.error("academy_progress_failed");
  return Response.json(
    { error: "Não foi possível salvar o progresso. Tente novamente." },
    { status: 503 },
  );
}
export async function GET() {
  if (!(await cookies()).has("edson_session"))
    return Response.json(
      { error: "Entre na sua conta para continuar." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  try {
    const { requireUser } = await import("@/lib/auth");
    const user = await requireUser();
    const { academyRepository } = await import("@/lib/academy/repository");
    return Response.json(
      { progress: await academyRepository.load(user.id) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  if (!(await cookies()).has("edson_session"))
    return Response.json(
      { error: "Entre na sua conta para continuar." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  try {
    const { assertOrigin, requireUser, rateLimit } = await import("@/lib/auth");
    assertOrigin(request);
    const user = await requireUser();
    if (Number(request.headers.get("content-length")) > 12000)
      return Response.json(
        { error: "Atividade muito grande." },
        { status: 413 },
      );
    const raw = await request.text();
    if (raw.length > 12000)
      return Response.json(
        { error: "Atividade muito grande." },
        { status: 413 },
      );
    const input = schema.parse(JSON.parse(raw));
    await rateLimit(`academy:${user.id}`, 120, 60);
    const { academyRepository } = await import("@/lib/academy/repository");
    return Response.json(
      await changeProgress(academyRepository, user.id, input),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    // Validation of answers is separate from infrastructure failures.
    if (
      error instanceof Error &&
      [
        "Resposta não pertence à etapa.",
        "Responda a todas as perguntas.",
        "Etapa inválida.",
      ].includes(error.message)
    )
      return Response.json({ error: error.message }, { status: 400 });
    return failure(error);
  }
}
