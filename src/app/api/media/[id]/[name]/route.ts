import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getObject } from "@/lib/storage";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; name: string }> },
) {
  const { id, name } = await params;
  if (
    !/^(master\.m3u8|360\.m3u8|720\.m3u8|(360|720)-\d{4,}\.ts|thumbnail\.jpg|document\.pdf)$/.test(
      name,
    )
  )
    return new Response("Arquivo inválido", { status: 404 });
  const media = await db.media.findUnique({
    where: { id },
    include: {
      content: true,
      lesson: { include: { module: { include: { course: true } } } },
    },
  });
  if (!media || media.status !== "READY")
    return new Response("Arquivo indisponível", { status: 404 });
  const user = await currentUser();
  let allowed = user?.role === "ADMIN";
  // Lesson attachment always has enrollment-level protection, even if also linked to public content.
  if (media.lesson) {
    if (user && media.lesson.module.course.status === "PUBLISHED") {
      allowed =
        allowed ||
        !!(await db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: media.lesson.module.courseId,
            },
          },
        }));
    }
  } else if (media.content?.status === "PUBLISHED") {
    allowed = allowed || media.content.visibility === "PUBLIC";
    if (!allowed && user && media.contentId)
      allowed = !!(await db.enrollment.findFirst({
        where: {
          userId: user.id,
          course: {
            status: "PUBLISHED",
            modules: {
              some: { lessons: { some: { videoContentId: media.contentId } } },
            },
          },
        },
      }));
  }
  if (!allowed) return new Response("Acesso restrito", { status: 403 });
  try {
    const object = await getObject(`processed/${id}/${name}`);
    const data = await object.Body!.transformToByteArray();
    const headers: Record<string, string> = {
      "Content-Type": object.ContentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (name.endsWith(".pdf"))
      headers["Content-Disposition"] =
        'attachment; filename="material-edson-oficina.pdf"';
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("Arquivo não encontrado", { status: 404 });
  }
}
