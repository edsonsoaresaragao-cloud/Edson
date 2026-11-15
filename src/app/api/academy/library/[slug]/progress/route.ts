import { z } from "zod";
import { cookies } from "next/headers";
import { requirePublishedLibraryCourse } from "@/lib/academy/library/access";
import { changeLibraryProgress } from "@/lib/academy/library/progress";
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
    studied: z.boolean().optional(),
    answers: z
      .record(z.string().max(80), z.number().int().min(0).max(5))
      .optional(),
  })
  .strict();
async function failure(error: unknown) {
  if (error instanceof StudyError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers },
    );
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return Response.json(
      { error: "Dados da atividade inválidos." },
      { status: 400, headers },
    );
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number" &&
    error instanceof Error
  )
    return Response.json(
      { error: error.message },
      { status: error.status, headers },
    );
  console.error("academy_library_progress_failed");
  return Response.json(
    { error: "Não foi possível salvar seu progresso. Tente novamente." },
    { status: 503, headers },
  );
}
async function session() {
  if (!(await cookies()).has("edson_session"))
    throw new StudyError("Entre na sua conta para continuar.", 401);
  const { requireUser } = await import("@/lib/auth");
  return requireUser();
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!(await cookies()).has("edson_session"))
      throw new StudyError("Entre na sua conta para continuar.", 401);
    const { course, document } = await requirePublishedLibraryCourse(
      (await params).slug,
    );
    const user = await session();
    const { createLibraryRepository } =
      await import("@/lib/academy/library/repository");
    return Response.json(
      {
        progress: await createLibraryRepository(course, document).load(user.id),
      },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!(await cookies()).has("edson_session"))
      throw new StudyError("Entre na sua conta para continuar.", 401);
    // Parse before opening the database, and never accept client identity or score fields.
    if (Number(request.headers.get("content-length")) > 24000)
      throw new StudyError("Atividade muito grande.", 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 24000)
      throw new StudyError("Atividade muito grande.", 413);
    const input = schema.parse(JSON.parse(raw));
    const { course, document } = await requirePublishedLibraryCourse(
      (await params).slug,
    );
    const user = await session();
    const { assertOrigin, rateLimit } = await import("@/lib/auth");
    assertOrigin(request);
    await rateLimit(`academy:library:${course.id}:${user.id}`, 120, 60);
    const { createLibraryRepository } =
      await import("@/lib/academy/library/repository");
    return Response.json(
      await changeLibraryProgress(
        createLibraryRepository(course, document),
        document,
        user.id,
        input,
      ),
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
