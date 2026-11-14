import { z } from "zod";
import { cookies } from "next/headers";
import { changeProgress } from "@/lib/academy/checklist/progress";
import { StudyError } from "@/lib/academy/progress";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const schema = z
  .object({
    action: z.enum(["start", "visit", "complete"]),
    step: z.string().max(40).optional(),
    answers: z
      .record(z.string().max(40), z.number().int().min(0).max(9))
      .optional(),
    checks: z.array(z.string().max(60)).max(7).optional(),
  })
  .strict();
async function failure(error: unknown) {
  const { AppError } = await import("@/lib/auth");
  if (error instanceof AppError || error instanceof StudyError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers },
    );
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return Response.json(
      { error: "Dados da atividade inválidos." },
      { status: 400, headers },
    );
  console.error("academy_checklist_progress_failed");
  return Response.json(
    { error: "Não foi possível salvar o progresso. Tente novamente." },
    { status: 503, headers },
  );
}
export async function GET() {
  if (!(await cookies()).has("edson_session"))
    return Response.json(
      { error: "Entre na sua conta para continuar." },
      { status: 401, headers },
    );
  try {
    const { requireUser } = await import("@/lib/auth");
    const user = await requireUser();
    const { checklistRepository } =
      await import("@/lib/academy/checklist/repository");
    return Response.json(
      { progress: await checklistRepository.load(user.id) },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  if (!(await cookies()).has("edson_session"))
    return Response.json(
      { error: "Entre na sua conta para continuar." },
      { status: 401, headers },
    );
  try {
    const { assertOrigin, requireUser, rateLimit } = await import("@/lib/auth");
    assertOrigin(request);
    const user = await requireUser();
    if (Number(request.headers.get("content-length")) > 12000)
      return Response.json(
        { error: "Atividade muito grande." },
        { status: 413, headers },
      );
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 12000)
      return Response.json(
        { error: "Atividade muito grande." },
        { status: 413, headers },
      );
    const input = schema.parse(JSON.parse(raw));
    await rateLimit(`academy:aula02:${user.id}`, 120, 60);
    const { checklistRepository } =
      await import("@/lib/academy/checklist/repository");
    return Response.json(
      await changeProgress(checklistRepository, user.id, input),
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
