import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { db } from "@/lib/db";
import {
  assertOrigin,
  AppError,
  requireAdmin,
  requireEditor,
  requireUser,
  setSession,
  clearSession,
  rateLimit,
  audit,
  newToken,
  hashToken,
} from "@/lib/auth";
import {
  emailSchema,
  passwordSchema,
  contentSchema,
  courseSchema,
  modulesSchema,
  parseJson,
} from "@/lib/validation";
import { slugify } from "@/lib/catalog";
import { s3, bucket, headObject, deleteMediaObjects } from "@/lib/storage";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertOrigin(request);
    const { action } = await params;
    const form = await request.formData();
    const get = (key: string) => String(form.get(key) || "");
    const id = get("id");
    if (action === "register") {
      await rateLimit("registration", 30, 3600);
      const email = emailSchema.parse(get("email"));
      const name = z.string().trim().min(2).max(100).parse(get("name"));
      const password = passwordSchema.parse(get("password"));
      if (get("consent") !== "on")
        throw new AppError(
          "Aceite a política de privacidade para criar sua conta.",
        );
      if (await db.user.findUnique({ where: { email } }))
        throw new AppError(
          "Não foi possível cadastrar esse e-mail. Tente entrar ou recuperar sua senha.",
        );
      const user = await db.user.create({
        data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
      });
      await setSession(user);
      return NextResponse.json({ redirect: "/aluno" });
    }
    if (action === "login") {
      const email = emailSchema.parse(get("email"));
      await rateLimit("login:" + hashToken(email), 8, 900);
      await rateLimit("login:global", 200, 900);
      const user = await db.user.findUnique({ where: { email } });
      const ok = await bcrypt.compare(
        get("password").slice(0, 100),
        user?.passwordHash ||
          "$2b$12$KIXQ6vQb7QO0cU5ueoOeKeRyDdQF9QJ7iG1TQHIZVRkM8m0B.zQs6",
      );
      if (!user || !ok) throw new AppError("E-mail ou senha inválidos.", 401);
      await setSession(user);
      return NextResponse.json({
        redirect: user.role === "ADMIN" ? "/admin" : "/aluno",
      });
    }
    if (action === "logout") {
      await clearSession();
      return NextResponse.json({ redirect: "/" });
    }
    if (action === "recover") {
      const email = emailSchema.parse(get("email"));
      await rateLimit("recover:" + hashToken(email), 3, 3600);
      await rateLimit("recover:global", 30, 3600);
      if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
        throw new AppError(
          "Recuperação por e-mail pendente de configuração SMTP. Entre em contato com o responsável.",
          503,
        );
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        const token = newToken();
        await db.passwordReset.create({
          data: {
            id: hashToken(token),
            userId: user.id,
            expiresAt: new Date(Date.now() + 1800000),
          },
        });
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
        });
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: "Recuperação de senha • EDSON OFICINA",
          text: `Para redefinir sua senha, acesse ${process.env.APP_URL}/redefinir-senha?token=${token}\nO link expira em 30 minutos. Se não solicitou, ignore.`,
        });
      }
      return NextResponse.json({
        message: "Se a conta existir, você receberá as instruções por e-mail.",
      });
    }
    if (action === "reset") {
      const token = z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(get("token"));
      const password = passwordSchema.parse(get("password"));
      const hash = await bcrypt.hash(password, 12);
      await db.$transaction(async (tx) => {
        const reset = await tx.passwordReset.findUnique({
          where: { id: hashToken(token) },
        });
        if (!reset || reset.expiresAt < new Date())
          throw new AppError("Link inválido ou expirado.");
        await tx.passwordReset.delete({ where: { id: reset.id } });
        await tx.user.update({
          where: { id: reset.userId },
          data: { passwordHash: hash, sessionVersion: { increment: 1 } },
        });
        await tx.passwordReset.deleteMany({ where: { userId: reset.userId } });
      });
      await clearSession();
      return NextResponse.json({ redirect: "/login" });
    }
    if (action === "contact") {
      if (get("website"))
        return NextResponse.json({ message: "Mensagem recebida." });
      const email = emailSchema.parse(get("email"));
      await rateLimit("contact:" + hashToken(email), 3, 3600);
      await rateLimit("contact:global", 30, 3600);
      if (get("consent") !== "on")
        throw new AppError(
          "Confirme o uso dos dados para responder à mensagem.",
        );
      await db.contact.create({
        data: {
          name: z.string().trim().min(2).max(100).parse(get("name")),
          email,
          message: z.string().trim().min(10).max(5000).parse(get("message")),
        },
      });
      return NextResponse.json({
        message: "Mensagem recebida. Edson poderá consultá-la no painel.",
      });
    }
    const user = await requireUser();
    if (action === "profile") {
      const name = z.string().trim().min(2).max(100).parse(get("name"));
      await db.user.update({ where: { id: user.id }, data: { name } });
      return NextResponse.json({ message: "Perfil atualizado." });
    }
    if (action === "enroll") {
      const course = await db.course.findUnique({ where: { id } });
      if (!course || course.status !== "PUBLISHED")
        throw new AppError("Curso indisponível.", 404);
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: id } },
        update: {},
        create: { userId: user.id, courseId: id },
      });
      return NextResponse.json({ redirect: "/aluno/cursos/" + id });
    }
    if (action === "complete-lesson") {
      const lesson = await db.lesson.findUnique({
        where: { id },
        include: { module: { include: { course: true } }, questions: true },
      });
      if (!lesson || lesson.module.course.status !== "PUBLISHED")
        throw new AppError("Aula indisponível.", 404);
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: lesson.module.courseId,
          },
        },
      });
      if (!enrollment) throw new AppError("Matrícula necessária.", 403);
      const correct = lesson.questions.filter(
        (q) =>
          Number(get("answer-" + q.id)) === q.correctIndex &&
          form.has("answer-" + q.id),
      ).length;
      const score = lesson.questions.length
        ? Math.round((100 * correct) / lesson.questions.length)
        : 100;
      if (score < lesson.module.course.passingScore)
        throw new AppError(
          `Você alcançou ${score}%. Revise o conteúdo e tente novamente. Mínimo: ${lesson.module.course.passingScore}%.`,
        );
      await db.progress.upsert({
        where: {
          enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: id },
        },
        create: { enrollmentId: enrollment.id, lessonId: id, score },
        update: { score, completedAt: new Date() },
      });
      return NextResponse.json({
        message: `Aula concluída. Aproveitamento: ${score}%.`,
      });
    }
    if (action === "certificate") {
      const enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: id } },
        include: {
          progress: true,
          course: { include: { modules: { include: { lessons: true } } } },
        },
      });
      if (!enrollment || enrollment.course.status !== "PUBLISHED")
        throw new AppError("Matrícula indisponível.");
      const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
      if (
        !lessons.length ||
        !lessons.every((l) =>
          enrollment.progress.some(
            (p) =>
              p.lessonId === l.id && p.score >= enrollment.course.passingScore,
          ),
        )
      )
        throw new AppError(
          "Conclua todas as aulas e questionários para emitir o certificado.",
        );
      const cert = await db.certificate.upsert({
        where: { userId_courseId: { userId: user.id, courseId: id } },
        update: {},
        create: {
          userId: user.id,
          courseId: id,
          studentName: user.name,
          courseTitle: enrollment.course.title,
          hours: enrollment.course.hours,
          code: newToken().slice(0, 24).toUpperCase(),
        },
      });
      return NextResponse.json({ redirect: "/certificados/" + cert.code });
    }
    if (
      [
        "content-save",
        "content-delete",
        "category-save",
        "course-save",
        "upload-sign",
        "upload-finish",
        "media-delete",
      ].includes(action)
    )
      await requireEditor();
    else await requireAdmin();
    if (action === "content-save") {
      const data = contentSchema.parse({
        kind: get("kind"),
        visibility: get("visibility") || "PUBLIC",
        instructor: get("instructor"),
        difficulty: get("difficulty") || "BASIC",
        title: get("title"),
        summary: get("summary"),
        body: get("body"),
        status: get("status"),
        author: get("author"),
        imageUrl: get("imageUrl"),
        sourceUrl: get("sourceUrl"),
        brand: get("brand"),
        vehicleModel: get("vehicleModel"),
        year: get("year"),
        youtubeId: get("youtubeId"),
        categorySlugs: form.getAll("categories").map(String),
        tags: get("tags")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        publishAt: get("publishAt"),
      });
      const publishAt = data.publishAt ? new Date(data.publishAt) : null;
      if (
        data.status === "SCHEDULED" &&
        (!publishAt || !Number.isFinite(publishAt.getTime()))
      )
        throw new AppError("Informe data e hora válidas para agendar.");
      const { youtubeId, year, ...rest } = data;
      const saved = await db.content.upsert({
        where: { id: id || "new" },
        create: {
          ...rest,
          year: year === "" ? null : year,
          youtubeId: youtubeId || null,
          publishAt,
          slug: slugify(data.title) + "-" + newToken().slice(0, 6),
          manualCategories: true,
        },
        update: {
          ...rest,
          year: year === "" ? null : year,
          youtubeId: youtubeId || null,
          publishAt,
          manualCategories: true,
        },
      });
      await audit(user.id, "content.save", saved.id);
      return NextResponse.json({
        redirect: "/admin/conteudos?edit=" + saved.id,
      });
    }
    if (action === "content-delete") {
      if (get("confirm") !== "EXCLUIR")
        throw new AppError("Digite EXCLUIR para confirmar.");
      await db.content.delete({ where: { id } });
      await audit(user.id, "content.delete", id);
      return NextResponse.json({ redirect: "/admin/conteudos" });
    }
    if (action === "category-save") {
      const name = z.string().trim().min(2).max(100).parse(get("name"));
      const description = z
        .string()
        .min(10)
        .max(3000)
        .parse(get("description"));
      const parentId = get("parentId") || null;
      if (id && parentId) {
        let p: string | null = parentId;
        while (p) {
          if (p === id) throw new AppError("A hierarquia criaria um ciclo.");
          const row: { parentId: string | null } | null =
            await db.category.findUnique({
              where: { id: p },
              select: { parentId: true },
            });
          p = row?.parentId || null;
        }
      }
      const category = await db.category.upsert({
        where: { id: id || "new" },
        create: { name, description, parentId, slug: slugify(name) },
        update: { name, description, parentId },
      });
      await audit(user.id, "category.save", category.id);
      return NextResponse.json({ message: "Categoria salva." });
    }
    if (action === "course-save") {
      const data = courseSchema.parse({
        ...Object.fromEntries(
          [
            "title",
            "description",
            "instructor",
            "hours",
            "passingScore",
            "status",
            "objectives",
            "audience",
            "prerequisites",
          ].map((k) => [k, get(k)]),
        ),
        imageUrl: get("imageUrl"),
        categorySlugs: form.getAll("categories").map(String),
      });
      const structure = parseJson(get("structure"), modulesSchema);
      const hasEnrollments =
        id && (await db.enrollment.count({ where: { courseId: id } })) > 0;
      if (hasEnrollments) {
        const existing = await db.course.findUniqueOrThrow({
          where: { id },
          include: {
            modules: {
              orderBy: { position: "asc" },
              include: {
                lessons: {
                  orderBy: { position: "asc" },
                  include: { questions: true },
                },
              },
            },
          },
        });
        const clean = (ms: typeof structure) =>
          ms.map((m) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({
              title: l.title,
              body: l.body,
              youtubeId: l.youtubeId || "",
              videoContentId: l.videoContentId || "",
              questions: l.questions.map((q) => ({
                prompt: q.prompt,
                options: q.options,
                correctIndex: q.correctIndex,
              })),
            })),
          }));
        if (
          JSON.stringify(
            clean(
              existing.modules.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) => ({
                  ...l,
                  youtubeId: l.youtubeId || "",
                  videoContentId: l.videoContentId || "",
                })),
              })),
            ),
          ) !== JSON.stringify(clean(structure)) ||
          existing.passingScore !== data.passingScore ||
          existing.hours !== data.hours
        )
          throw new AppError(
            "Curso com matrículas: preserve aulas, carga horária e critérios. Crie uma nova edição para alterar a estrutura.",
          );
        await db.course.update({ where: { id }, data });
        await audit(user.id, "course.metadata", id);
        return NextResponse.json({ redirect: "/admin/cursos?edit=" + id });
      }
      for (const courseModule of structure)
        for (const lesson of courseModule.lessons) {
          if (
            lesson.videoContentId &&
            !(await db.content.findUnique({
              where: { id: lesson.videoContentId, kind: "VIDEO" },
            }))
          )
            throw new AppError("Vídeo próprio não encontrado.");
        }
      const course = await db.$transaction(async (tx) => {
        const c = await tx.course.upsert({
          where: { id: id || "new" },
          create: {
            ...data,
            slug: slugify(data.title) + "-" + newToken().slice(0, 6),
          },
          update: data,
        });
        await tx.module.deleteMany({ where: { courseId: c.id } });
        for (const [position, m] of structure.entries())
          await tx.module.create({
            data: {
              title: m.title,
              position,
              courseId: c.id,
              lessons: {
                create: m.lessons.map((l, i) => ({
                  title: l.title,
                  body: l.body,
                  youtubeId: l.youtubeId || null,
                  videoContentId: l.videoContentId || null,
                  position: i,
                  questions: { create: l.questions },
                })),
              },
            },
          });
        return c;
      });
      await audit(user.id, "course.save", course.id);
      return NextResponse.json({ redirect: "/admin/cursos?edit=" + course.id });
    }
    if (action === "user-create") {
      const email = emailSchema.parse(get("email"));
      const name = z.string().trim().min(2).max(100).parse(get("name"));
      const password = passwordSchema.parse(get("password"));
      const role = z
        .enum(["STUDENT", "EDITOR"])
        .parse(get("role") || "STUDENT");
      const created = await db.user.create({
        data: {
          name,
          email,
          role,
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      await audit(user.id, "user.create", created.id);
      return NextResponse.json({
        message:
          "Usuário criado. Entregue a senha temporária por um canal privado e oriente a redefinição.",
      });
    }
    if (action === "user-role") {
      const role = z.enum(["STUDENT", "EDITOR", "ADMIN"]).parse(get("role"));
      if (id === user.id && role !== "ADMIN")
        throw new AppError(
          "Não é possível remover seu próprio acesso administrativo.",
        );
      await db.user.update({
        where: { id },
        data: { role, sessionVersion: { increment: 1 } },
      });
      await audit(user.id, "user.role", id);
      return NextResponse.json({
        message: "Perfil atualizado e sessões anteriores revogadas.",
      });
    }
    if (action === "sync") {
      if (!process.env.YOUTUBE_API_KEY)
        throw new AppError(
          "Configure YOUTUBE_API_KEY para importar do YouTube.",
          503,
        );
      const mode = z
        .enum(["latest", "backfill"])
        .parse(get("mode") || "latest");
      const pending = await db.job.findFirst({
        where: { type: "YOUTUBE", status: { in: ["PENDING", "RUNNING"] } },
      });
      if (pending)
        throw new AppError(
          "Já existe uma sincronização aguardando ou em execução.",
        );
      await db.job.create({ data: { type: "YOUTUBE", payload: { mode } } });
      await audit(user.id, "youtube.enqueue", mode);
      return NextResponse.json({
        message:
          "Sincronização adicionada à fila. O worker executará a importação.",
      });
    }
    if (action === "upload-sign") {
      const name = z.string().min(1).max(200).parse(get("name"));
      const type = z
        .enum(["video/mp4", "video/webm", "video/quicktime", "application/pdf"])
        .parse(get("type"));
      const size = z.coerce
        .number()
        .int()
        .min(1)
        .max(200 * 1024 * 1024)
        .parse(get("size"));
      const contentId = get("contentId") || null;
      const lessonId = get("lessonId") || null;
      if (!contentId && !lessonId)
        throw new AppError("Associe o arquivo a um vídeo ou aula.");
      if (
        contentId &&
        !(await db.content.findUnique({
          where: { id: contentId, kind: "VIDEO" },
        }))
      )
        throw new AppError("Vídeo não encontrado.");
      if (
        lessonId &&
        !(await db.lesson.findUnique({ where: { id: lessonId } }))
      )
        throw new AppError("Aula não encontrada.");
      const objectKey = "originals/" + newToken();
      const signed = await createPresignedPost(s3(true), {
        Bucket: bucket(),
        Key: objectKey,
        Conditions: [
          ["content-length-range", 1, 200 * 1024 * 1024],
          ["eq", "$Content-Type", type],
        ],
        Fields: { "Content-Type": type },
        Expires: 600,
      });
      const media = await db.media.create({
        data: {
          contentId,
          lessonId,
          objectKey,
          originalName: name,
          mimeType: type,
          size,
        },
      });
      await audit(user.id, "media.sign", media.id);
      return NextResponse.json({ id: media.id, ...signed });
    }
    if (action === "upload-finish") {
      const media = await db.media.findUnique({ where: { id } });
      if (!media || media.status !== "PENDING")
        throw new AppError("Envio não encontrado ou já finalizado.");
      const object = await headObject(media.objectKey);
      if (
        object.ContentLength !== media.size ||
        object.ContentType !== media.mimeType
      )
        throw new AppError(
          "O arquivo recebido não corresponde ao envio declarado.",
        );
      await db.$transaction([
        db.media.update({ where: { id }, data: { status: "QUEUED" } }),
        db.job.create({ data: { type: "MEDIA", payload: { mediaId: id } } }),
      ]);
      await audit(user.id, "media.upload", id);
      return NextResponse.json({
        message:
          "Arquivo recebido. A validação e o processamento ocorrerão em segundo plano.",
      });
    }
    if (action === "media-delete") {
      if (get("confirm") !== "EXCLUIR")
        throw new AppError("Digite EXCLUIR para confirmar.");
      const media = await db.media.findUnique({ where: { id } });
      if (!media) throw new AppError("Arquivo não encontrado.", 404);
      const locked = await db.media.updateMany({
        where: { id, status: { in: ["PENDING", "READY", "FAILED"] } },
        data: { status: "DELETING" },
      });
      if (!locked.count)
        throw new AppError(
          "Aguarde o processamento terminar antes de excluir.",
        );
      try {
        await deleteMediaObjects(id, media.objectKey);
        await db.media.delete({ where: { id } });
        await audit(user.id, "media.delete", id);
      } catch {
        await db.media.update({
          where: { id },
          data: {
            status: "FAILED",
            error:
              "Falha na exclusão do armazenamento. Corrija a conexão e tente excluir novamente.",
          },
        });
        throw new AppError("Falha ao excluir arquivo do armazenamento.", 502);
      }
      return NextResponse.json({
        message: "Arquivo original e versões processadas excluídos.",
      });
    }
    if (action === "job-retry") {
      const job = await db.job.findUnique({ where: { id } });
      if (!job || job.status !== "FAILED")
        throw new AppError(
          "Somente tarefas com falha podem ser reenfileiradas.",
        );
      await db.job.update({
        where: { id },
        data: {
          status: "PENDING",
          attempts: 0,
          error: null,
          availableAt: new Date(),
        },
      });
      await audit(user.id, "job.retry", id);
      return NextResponse.json({ message: "Tarefa reenfileirada." });
    }
    if (action === "session-revoke") {
      await db.user.update({
        where: { id },
        data: { sessionVersion: { increment: 1 } },
      });
      await audit(user.id, "user.revoke", id);
      if (id === user.id) await clearSession();
      return NextResponse.json({ message: "Sessões revogadas." });
    }
    // Ensure the cookie API is only available through checked same-origin mutations.
    void cookies;
    throw new AppError("Operação não encontrada.", 404);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof Error && "code" in error && error.code === "P2002")
      return NextResponse.json(
        { error: "Já existe um registro com esse identificador." },
        { status: 409 },
      );
    console.error(
      "Ação falhou:",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      {
        error:
          "Não foi possível concluir a operação. Verifique a configuração e os logs do servidor.",
      },
      { status: 500 },
    );
  }
}
