import "dotenv/config";
import { db } from "../src/lib/db";
import { syncYouTube } from "../src/lib/youtube";
import { refreshVideoCategories } from "../src/lib/refresh-video-categories";
import { getObject, putObject } from "../src/lib/storage";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
let stopped = false;
process.on("SIGTERM", () => {
  stopped = true;
});
process.on("SIGINT", () => {
  stopped = true;
});
async function processMedia(mediaId: string) {
  const media = await db.media.findUniqueOrThrow({ where: { id: mediaId } });
  const dir = await mkdtemp(join(tmpdir(), "edson-media-"));
  try {
    await db.media.update({
      where: { id: mediaId },
      data: { status: "PROCESSING", error: null },
    });
    const object = await getObject(media.objectKey);
    const input = join(dir, "input");
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
      bytes += chunk.length;
      if (bytes > 200 * 1024 * 1024)
        throw new Error("Arquivo excede o limite.");
      chunks.push(Buffer.from(chunk));
    }
    await writeFile(input, Buffer.concat(chunks));
    if (media.mimeType === "application/pdf") {
      const data = await readFile(input);
      if (!data.subarray(0, 5).equals(Buffer.from("%PDF-")))
        throw new Error("Assinatura PDF inválida.");
      // Reject active content. Files are served only as downloads, never inline.
      if (
        /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|OpenAction|AA)\b/.test(
          data.toString("latin1"),
        )
      )
        throw new Error("PDF com conteúdo ativo não permitido.");
      await putObject(
        `processed/${media.id}/document.pdf`,
        data,
        "application/pdf",
      );
    } else {
      const probe = await exec(
        "ffprobe",
        ["-v", "error", "-show_format", "-show_streams", "-of", "json", input],
        { timeout: 30000, maxBuffer: 1024 * 1024 },
      );
      const info = JSON.parse(probe.stdout);
      if (
        !info.streams.some(
          (s: { codec_type: string }) => s.codec_type === "video",
        ) ||
        !Number.isFinite(Number(info.format.duration)) ||
        Number(info.format.duration) > 7200 ||
        info.streams.length > 16 ||
        info.streams.some(
          (s: { codec_type: string; width?: number; height?: number }) =>
            s.codec_type === "video" &&
            (!s.width || !s.height || s.width > 4096 || s.height > 2160),
        )
      )
        throw new Error(
          "Vídeo inválido, duração superior a duas horas ou resolução acima de 4096 × 2160.",
        );
      for (const height of [360, 720]) {
        const width = height === 360 ? 640 : 1280;
        await exec(
          "ffmpeg",
          [
            "-nostdin",
            "-v",
            "error",
            "-protocol_whitelist",
            "file,pipe",
            "-i",
            input,
            "-map",
            "0:v:0",
            "-map",
            "0:a:0?",
            "-vf",
            `scale=${width}:${height}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "25",
            "-threads",
            "2",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-ac",
            "2",
            "-hls_time",
            "6",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            join(dir, `${height}-%04d.ts`),
            "-f",
            "hls",
            join(dir, `${height}.m3u8`),
          ],
          { timeout: 3600000, maxBuffer: 1024 * 1024 },
        );
      }
      await exec(
        "ffmpeg",
        [
          "-nostdin",
          "-v",
          "error",
          "-protocol_whitelist",
          "file,pipe",
          "-i",
          input,
          "-frames:v",
          "1",
          "-vf",
          "scale=640:-2",
          join(dir, "thumbnail.jpg"),
        ],
        { timeout: 60000 },
      );
      await writeFile(
        join(dir, "master.m3u8"),
        "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\n720.m3u8\n",
      );
      for (const name of await readdir(dir)) {
        if (name === "input") continue;
        await putObject(
          `processed/${media.id}/${name}`,
          await readFile(join(dir, name)),
          name.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : name.endsWith(".ts")
              ? "video/mp2t"
              : "image/jpeg",
        );
      }
    }
    await db.media.update({
      where: { id: mediaId },
      data: { status: "READY", error: null },
    });
  } catch (e) {
    await db.media.update({
      where: { id: mediaId },
      data: {
        status: "FAILED",
        error:
          e instanceof Error
            ? e.message.slice(0, 300)
            : "Falha no processamento",
      },
    });
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
async function loop() {
  console.log(
    "Worker iniciado: fila PostgreSQL, YouTube e processamento de mídia.",
  );
  try {
    const refreshed = await refreshVideoCategories();
    if (refreshed)
      console.log(`Categorias atualizadas em ${refreshed} vídeos importados.`);
  } catch {
    console.error(
      "Não foi possível atualizar as categorias do acervo nesta inicialização.",
    );
  }
  while (!stopped) {
    try {
      const now = new Date();
      await db.content.updateMany({
        where: { status: "SCHEDULED", publishAt: { lte: now } },
        data: { status: "PUBLISHED" },
      });
      // Dead jobs can safely retry because sync and processing writes are idempotent.
      await db.job.updateMany({
        where: {
          status: "RUNNING",
          lockedAt: { lt: new Date(Date.now() - 2 * 3600000) },
        },
        data: { status: "PENDING", lockedAt: null },
      });
      if (process.env.YOUTUBE_API_KEY) {
        await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(4839202)`;
          const pending = await tx.job.findFirst({
            where: { type: "YOUTUBE", status: { in: ["PENDING", "RUNNING"] } },
          });
          const last = await tx.job.findFirst({
            where: { type: "YOUTUBE" },
            orderBy: { createdAt: "desc" },
          });
          const channel = await tx.channel.findUnique({
            where: { id: "UCkwom28UGBpkHFeTvOsLN8w" },
          });
          const mode = channel?.nextPageToken ? "backfill" : "latest";
          const interval =
            mode === "backfill"
              ? 60000
              : Math.max(
                  15,
                  Number(process.env.YOUTUBE_SYNC_INTERVAL_MINUTES || 360),
                ) * 60000;
          if (
            !pending &&
            (!last || last.createdAt.getTime() < Date.now() - interval)
          )
            await tx.job.create({
              data: { type: "YOUTUBE", payload: { mode } },
            });
        });
      }
      const jobs = await db.$queryRaw<
        {
          id: string;
          type: string;
          payload: { mediaId?: string; mode?: "latest" | "backfill" };
          attempts: number;
        }[]
      >`UPDATE "Job" SET status='RUNNING',"lockedAt"=NOW(),attempts=attempts+1 WHERE id=(SELECT id FROM "Job" WHERE status='PENDING' AND "availableAt"<=NOW() ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
      const job = jobs[0];
      if (job) {
        try {
          if (job.type === "YOUTUBE") await syncYouTube(job.payload.mode);
          else if (job.type === "MEDIA" && job.payload.mediaId)
            await processMedia(job.payload.mediaId);
          else throw new Error("Tipo de tarefa desconhecido.");
          await db.job.update({
            where: { id: job.id },
            data: { status: "DONE", error: null },
          });
        } catch {
          await db.job.update({
            where: { id: job.id },
            data: {
              status: job.attempts >= 3 ? "FAILED" : "PENDING",
              error:
                "Falha na execução. Consulte a sincronização ou o arquivo associado.",
              availableAt: new Date(Date.now() + job.attempts * 60000),
              lockedAt: null,
            },
          });
        }
      }
      await db.passwordReset.deleteMany({ where: { expiresAt: { lt: now } } });
      await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
    } catch (e) {
      console.error("Worker:", e instanceof Error ? e.name : "unknown");
    }
    if (!stopped) await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  await db.$disconnect();
}
loop();
