import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PageHeading } from "@/components/content";
import { ActionForm } from "@/components/forms";
import { VideoPlayer, YouTubePlayer } from "@/components/player";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Learning({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/login");
  const { id } = await params;
  const e = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: u.id, courseId: id } },
    include: {
      progress: true,
      course: {
        include: {
          modules: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                orderBy: { position: "asc" },
                include: {
                  questions: {
                    select: { id: true, prompt: true, options: true },
                  },
                  media: { where: { status: "READY" } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!e || e.course.status !== "PUBLISHED") notFound();
  const ownIds = e.course.modules
    .flatMap((m) => m.lessons)
    .map((l) => l.videoContentId)
    .filter((id): id is string => !!id);
  const videos = await db.media.findMany({
    where: { contentId: { in: ownIds }, status: "READY", lessonId: null },
    include: { content: true },
  });
  return (
    <div className="container page-content">
      <PageHeading
        eyebrow="ÁREA DO ALUNO / TREINAMENTO"
        title={e.course.title}
        description={`Seu progresso: ${e.progress.length} aulas concluídas.`}
      />
      <Link href="/aluno" className="text-link">
        ← Voltar para meus cursos
      </Link>
      {e.course.modules.map((m) => (
        <section className="section" key={m.id}>
          <h2>{m.title}</h2>
          {m.lessons.map((l) => (
            <article className="card lesson" key={l.id}>
              <span className="badge">
                {e.progress.some((p) => p.lessonId === l.id)
                  ? "CONCLUÍDA ✓"
                  : "EM ANDAMENTO"}
              </span>
              <h3>{l.title}</h3>
              {l.youtubeId && (
                <>
                  <YouTubePlayer id={l.youtubeId} title={l.title} />
                  <p className="credit">
                    <a
                      href={"https://www.youtube.com/watch?v=" + l.youtubeId}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Assistir no canal de origem no YouTube ↗
                    </a>
                  </p>
                </>
              )}
              {l.media
                .filter((m) => m.mimeType.startsWith("video/"))
                .map((m) => (
                  <VideoPlayer mediaId={m.id} key={m.id} />
                ))}
              {videos
                .filter(
                  (v) =>
                    v.contentId === l.videoContentId &&
                    v.content?.status === "PUBLISHED",
                )
                .map((v) => (
                  <VideoPlayer mediaId={v.id} key={v.id} />
                ))}
              <div className="prose">{l.body}</div>
              {l.media
                .filter((m) => m.mimeType === "application/pdf")
                .map((m) => (
                  <a
                    className="button secondary"
                    href={`/api/media/${m.id}/document.pdf`}
                    key={m.id}
                  >
                    Baixar apostila: {m.originalName}
                  </a>
                ))}
              <ActionForm
                action="complete-lesson"
                submitLabel={
                  l.questions.length
                    ? "Enviar respostas e concluir"
                    : "Marcar aula como concluída"
                }
              >
                <input type="hidden" name="id" value={l.id} />
                {l.questions.map((q) => (
                  <fieldset key={q.id}>
                    <legend>{q.prompt}</legend>
                    {q.options.map((o, i) => (
                      <label className="check" key={i}>
                        <input
                          type="radio"
                          name={"answer-" + q.id}
                          value={i}
                          required
                        />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </ActionForm>
            </article>
          ))}
        </section>
      ))}
      <div className="card">
        <h2>Certificado de conclusão</h2>
        <p>
          Conclua todas as aulas e questionários com aproveitamento mínimo de{" "}
          {e.course.passingScore}%.
        </p>
        <ActionForm action="certificate" submitLabel="Emitir meu certificado">
          <input type="hidden" name="id" value={id} />
        </ActionForm>
      </div>
    </div>
  );
}
