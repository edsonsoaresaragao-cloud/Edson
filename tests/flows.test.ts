import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { headObject } from "../src/lib/storage";
import { execFileSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error(
    "Testes funcionais permitidos somente em instância local de teste.",
  );
const suffix = randomBytes(6).toString("hex"),
  password = randomBytes(20).toString("hex");
async function post(
  action: string,
  values: Record<string, string>,
  cookie = "",
  origin = base,
) {
  const body = new FormData();
  for (const [k, v] of Object.entries(values)) body.set(k, v);
  const response = await fetch(base + "/api/actions/" + action, {
    method: "POST",
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body,
    redirect: "manual",
  });
  const json = await response.json();
  return {
    response,
    json,
    cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie,
  };
}
test(
  "fluxo real: autenticação, CMS, matrícula, progresso, certificado, acesso e armazenamento",
  { timeout: 180000 },
  async () => {
    let adminId = "",
      studentId = "",
      otherId = "",
      courseId = "",
      contentId = "",
      mediaId = "";
    let certificateCode = "";
    try {
      const admin = await db.user.create({
        data: {
          name: "Administrador de teste",
          email: `admin-${suffix}@example.invalid`,
          role: "ADMIN",
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      adminId = admin.id;
      const login = await post("login", { email: admin.email, password });
      assert.equal(login.response.status, 200);
      const ac = login.cookie;
      assert.match(login.response.headers.get("set-cookie") || "", /HttpOnly/i);
      const csrf = await post("content-save", {}, ac, "https://hostil.invalid");
      assert.equal(csrf.response.status, 403);
      const denied = await post("content-save", {});
      assert.equal(denied.response.status, 401);
      const reg = await post("register", {
        name: "Aluno de teste",
        email: `student-${suffix}@example.invalid`,
        password,
        consent: "on",
      });
      assert.equal(reg.response.status, 200);
      const sc = reg.cookie;
      studentId = (
        await db.user.findUniqueOrThrow({
          where: { email: `student-${suffix}@example.invalid` },
        })
      ).id;
      const forbidden = await post("content-save", {}, sc);
      assert.equal(forbidden.response.status, 403);
      const create = await post(
        "content-save",
        {
          kind: "VIDEO",
          title: `Vídeo teste ${suffix}`,
          summary: "Material original de teste automatizado.",
          body: "Conteúdo educativo de teste.",
          status: "DRAFT",
          author: "Teste",
          imageUrl: "",
          sourceUrl: "",
          brand: "",
          vehicleModel: "",
          year: "",
          youtubeId: "",
          publishAt: "",
          tags: "",
        },
        ac,
      );
      assert.equal(create.response.status, 200);
      contentId = new URL(create.json.redirect, base).searchParams.get("edit")!;
      const structure = [
        {
          title: "Módulo de teste",
          lessons: [
            {
              title: "Aula restrita",
              body: "Conteúdo restrito educativo para teste de matrícula.",
              questions: [
                {
                  prompt: "Qual alternativa é correta?",
                  options: ["Sim", "Não"],
                  correctIndex: 0,
                },
              ],
            },
          ],
        },
      ];
      const created = await post(
        "course-save",
        {
          title: `Curso teste ${suffix}`,
          description:
            "Treinamento real temporário para validação automatizada.",
          instructor: "Teste",
          hours: "2",
          passingScore: "70",
          status: "PUBLISHED",
          objectives: "Validar fluxo",
          audience: "Testes",
          prerequisites: "Nenhum",
          imageUrl: "",
          structure: JSON.stringify(structure),
        },
        ac,
      );
      assert.equal(created.response.status, 200);
      courseId = new URL(created.json.redirect, base).searchParams.get("edit")!;
      const course = await db.course.findUniqueOrThrow({
        where: { id: courseId },
        include: {
          modules: { include: { lessons: { include: { questions: true } } } },
        },
      });
      const lesson = course.modules[0].lessons[0];
      const before = await post("complete-lesson", { id: lesson.id }, sc);
      assert.equal(before.response.status, 403);
      const enrollment = await post("enroll", { id: courseId }, sc);
      assert.equal(enrollment.response.status, 200);
      const early = await post("certificate", { id: courseId }, sc);
      assert.equal(early.response.status, 400);
      const wrong = await post(
        "complete-lesson",
        { id: lesson.id, ["answer-" + lesson.questions[0].id]: "1" },
        sc,
      );
      assert.equal(wrong.response.status, 400);
      assert.equal(
        await db.progress.count({ where: { lessonId: lesson.id } }),
        0,
      );
      const complete = await post(
        "complete-lesson",
        { id: lesson.id, ["answer-" + lesson.questions[0].id]: "0" },
        sc,
      );
      assert.equal(complete.response.status, 200);
      const issued = await post("certificate", { id: courseId }, sc);
      assert.equal(issued.response.status, 200);
      certificateCode = issued.json.redirect.split("/").pop();
      const again = await post("certificate", { id: courseId }, sc);
      assert.equal(again.json.redirect, issued.json.redirect);
      const pdf = await fetch(`${base}/api/certificates/${certificateCode}`, {
        headers: { Cookie: sc },
      });
      assert.equal(pdf.status, 200);
      assert.ok(
        Buffer.from(await pdf.arrayBuffer())
          .subarray(0, 5)
          .equals(Buffer.from("%PDF-")),
      );
      assert.equal(
        (await fetch(`${base}/api/certificates/${certificateCode}`)).status,
        403,
      );
      const stranger = await post("register", {
        name: "Outro aluno",
        email: `other-${suffix}@example.invalid`,
        password,
        consent: "on",
      });
      otherId = (
        await db.user.findUniqueOrThrow({
          where: { email: `other-${suffix}@example.invalid` },
        })
      ).id;
      assert.equal(
        (
          await fetch(`${base}/api/certificates/${certificateCode}`, {
            headers: { Cookie: stranger.cookie },
          })
        ).status,
        403,
      );
      const publicHtml = await (
        await fetch(`${base}/certificados/${certificateCode}`)
      ).text();
      assert.ok(!publicHtml.includes("Aluno de teste"));
      assert.equal(
        (
          await post(
            "course-save",
            {
              id: courseId,
              title: "Curso alterado",
              description: "Teste de preservação do histórico.",
              instructor: "Teste",
              hours: "2",
              passingScore: "70",
              status: "PUBLISHED",
              objectives: "",
              audience: "",
              prerequisites: "",
              imageUrl: "",
              structure: JSON.stringify([
                { ...structure[0], title: "Estrutura alterada" },
              ]),
            },
            ac,
          )
        ).response.status,
        400,
      );
      // Upload, byte validation, queue, HLS conversion and enrollment authorization.
      const path = `/tmp/edson-test-${suffix}.mp4`;
      execFileSync("ffmpeg", [
        "-nostdin",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc=size=320x240:rate=12",
        "-t",
        "1",
        "-pix_fmt",
        "yuv420p",
        "-threads",
        "1",
        path,
      ]);
      const data = await readFile(path);
      await rm(path);
      const sign = await post(
        "upload-sign",
        {
          name: "video-teste.mp4",
          type: "video/mp4",
          size: String(data.length),
          contentId,
          lessonId: lesson.id,
        },
        ac,
      );
      assert.equal(sign.response.status, 200, JSON.stringify(sign.json));
      mediaId = sign.json.id;
      const body = new FormData();
      Object.entries(sign.json.fields).forEach(([k, v]) =>
        body.set(k, String(v)),
      );
      body.set(
        "file",
        new Blob([data], { type: "video/mp4" }),
        "video-teste.mp4",
      );
      const uploaded = await fetch(sign.json.url, { method: "POST", body });
      assert.ok(
        uploaded.ok,
        `S3 upload HTTP ${uploaded.status}: ${await uploaded.text()}`,
      );
      assert.equal(
        (await post("upload-finish", { id: mediaId }, ac)).response.status,
        200,
      );
      const until = Date.now() + 90000;
      let status = "";
      while (Date.now() < until) {
        const media = await db.media.findUniqueOrThrow({
          where: { id: mediaId },
        });
        status = media.status;
        if (status === "READY" || status === "FAILED") break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      assert.equal(status, "READY");
      const hls = await fetch(`${base}/api/media/${mediaId}/master.m3u8`, {
        headers: { Cookie: sc },
      });
      assert.equal(hls.status, 200);
      assert.match(await hls.text(), /#EXTM3U/);
      assert.equal(
        (
          await fetch(`${base}/api/media/${mediaId}/master.m3u8`, {
            headers: { Cookie: stranger.cookie },
          })
        ).status,
        403,
      );
      assert.equal(
        (await fetch(`${base}/api/media/${mediaId}/master.m3u8`)).status,
        403,
      );
      const search = await (
        await fetch(base + "/api/search?q=" + encodeURIComponent("injeção"))
      ).json();
      assert.ok(Array.isArray(search));
      const noKey = await post("sync", { mode: "latest" }, ac);
      if (!process.env.YOUTUBE_API_KEY)
        assert.equal(noKey.response.status, 503);
      const originalKey = (
        await db.media.findUniqueOrThrow({ where: { id: mediaId } })
      ).objectKey;
      assert.equal(
        (await post("media-delete", { id: mediaId, confirm: "CANCELAR" }, ac))
          .response.status,
        400,
      );
      assert.equal(
        (await post("media-delete", { id: mediaId, confirm: "EXCLUIR" }, ac))
          .response.status,
        200,
      );
      assert.equal(
        (
          await fetch(`${base}/api/media/${mediaId}/master.m3u8`, {
            headers: { Cookie: sc },
          })
        ).status,
        404,
      );
      await assert.rejects(
        headObject(originalKey),
        (e: unknown) =>
          !!e &&
          typeof e === "object" &&
          "$metadata" in e &&
          (e.$metadata as { httpStatusCode: number }).httpStatusCode === 404,
      );
      const resetToken = randomBytes(32).toString("hex"),
        resetHash = createHash("sha256").update(resetToken).digest("hex");
      await db.passwordReset.create({
        data: {
          id: resetHash,
          userId: studentId,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      const reset = await post("reset", {
        token: resetToken,
        password: password + "new",
      });
      assert.equal(reset.response.status, 200);
      assert.equal(
        (
          await post("reset", {
            token: resetToken,
            password: password + "again",
          })
        ).response.status,
        400,
      );
      assert.equal(
        (await post("profile", { name: "Sessão antiga" }, sc)).response.status,
        401,
      );
      const relogin = await post("login", {
        email: `student-${suffix}@example.invalid`,
        password: password + "new",
      });
      assert.equal(relogin.response.status, 200);
      await post("session-revoke", { id: studentId }, ac);
      assert.equal(
        (await post("profile", { name: "Sessão revogada" }, relogin.cookie))
          .response.status,
        401,
      );
      assert.equal(
        (await post("profile", { name: "Revogado" }, sc)).response.status,
        401,
      );
    } finally {
      if (mediaId) {
        try {
          const s3 = new S3Client({
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION,
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY!,
              secretAccessKey: process.env.S3_SECRET_KEY!,
            },
          });
          const row = await db.media.findUnique({ where: { id: mediaId } });
          const list = await s3.send(
            new ListObjectsV2Command({
              Bucket: process.env.S3_BUCKET,
              Prefix: "processed/" + mediaId,
            }),
          );
          const keys = [
            ...(list.Contents || []).map((o) => ({ Key: o.Key! })),
            ...(row ? [{ Key: row.objectKey }] : []),
          ];
          if (keys.length)
            await s3.send(
              new DeleteObjectsCommand({
                Bucket: process.env.S3_BUCKET,
                Delete: { Objects: keys },
              }),
            );
        } catch {}
        await db.media.deleteMany({ where: { id: mediaId } });
      }
      if (certificateCode)
        await db.certificate.deleteMany({ where: { code: certificateCode } });
      if (courseId) await db.course.deleteMany({ where: { id: courseId } });
      if (contentId) await db.content.deleteMany({ where: { id: contentId } });
      await db.audit.deleteMany({
        where: { actorId: { in: [adminId, studentId, otherId] } },
      });
      await db.user.deleteMany({
        where: { id: { in: [adminId, studentId, otherId] } },
      });
      if (mediaId)
        await db.job.deleteMany({
          where: { payload: { path: ["mediaId"], equals: mediaId } },
        });
      await db.$disconnect();
    }
  },
);
