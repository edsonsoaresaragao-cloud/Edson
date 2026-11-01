import { db } from "./db";
import { classify, slugify, CLASSIFICATION_VERSION } from "./catalog";
import { AppError } from "./auth";
import { z } from "zod";
const expected = "UCkwom28UGBpkHFeTvOsLN8w";
const channelSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        customUrl: z.string().optional(),
      }),
      contentDetails: z.object({
        relatedPlaylists: z.object({ uploads: z.string() }),
      }),
    }),
  ),
});
const playlistSchema = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(
    z.object({ contentDetails: z.object({ videoId: z.string() }) }),
  ),
});
const videosSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        description: z.string(),
        publishedAt: z.string(),
        channelId: z.string(),
        thumbnails: z.record(z.string(), z.object({ url: z.string() })),
      }),
      status: z.object({ embeddable: z.boolean(), privacyStatus: z.string() }),
      contentDetails: z.object({ duration: z.string() }),
      statistics: z.object({ viewCount: z.string().optional() }).optional(),
    }),
  ),
});
export async function syncYouTube(mode: "latest" | "backfill" = "latest") {
  if (!process.env.YOUTUBE_API_KEY)
    throw new AppError(
      "YouTube pendente: configure YOUTUBE_API_KEY no servidor.",
      503,
    );
  const channelId = process.env.YOUTUBE_CHANNEL_ID || expected;
  if (channelId !== expected)
    throw new AppError(
      "O canal configurado difere do ID autorizado. Revise a configuração.",
    );
  const run = await db.syncRun.create({ data: { status: "RUNNING" } });
  let units = 0,
    imported = 0;
  async function api(path: string, params: Record<string, string>) {
    // Reserve quota before every request, including failed requests.
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(4839201)`;
      const usage = await tx.syncRun.aggregate({
        where: {
          createdAt: { gte: new Date(new Date().toISOString().slice(0, 10)) },
        },
        _sum: { quotaUnits: true },
      });
      if (
        (usage._sum.quotaUnits || 0) >=
        Number(process.env.YOUTUBE_DAILY_QUOTA || 8000)
      )
        throw new AppError("Limite diário local de quota atingido.", 429);
      await tx.syncRun.update({
        where: { id: run.id },
        data: { quotaUnits: { increment: 1 } },
      });
    });
    units++;
    const url = new URL("https://www.googleapis.com/youtube/v3/" + path);
    Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY! }).forEach(
      ([k, v]) => url.searchParams.set(k, v),
    );
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new AppError(
        `YouTube respondeu HTTP ${response.status}. Verifique chave, permissões e quota.`,
        502,
      );
    return response.json();
  }
  try {
    const channels = channelSchema.parse(
      await api("channels", {
        part: "snippet,contentDetails",
        forHandle: process.env.YOUTUBE_HANDLE || "@OficinaBrasil-Oficial",
      }),
    );
    const channel = channels.items.find((c) => c.id === expected);
    if (!channel)
      throw new AppError(
        "Identidade do canal não validada; importação interrompida.",
      );
    const saved = await db.channel.upsert({
      where: { id: channel.id },
      create: {
        id: channel.id,
        title: channel.snippet.title,
        handle: process.env.YOUTUBE_HANDLE || "@OficinaBrasil-Oficial",
        uploadsPlaylist: channel.contentDetails.relatedPlaylists.uploads,
      },
      update: { title: channel.snippet.title },
    });
    const page = playlistSchema.parse(
      await api("playlistItems", {
        part: "contentDetails",
        playlistId: saved.uploadsPlaylist,
        maxResults: "50",
        ...(mode === "backfill" && saved.nextPageToken
          ? { pageToken: saved.nextPageToken }
          : {}),
      }),
    );
    const ids = page.items.map((v) => v.contentDetails.videoId);
    if (ids.length) {
      const videos = videosSchema.parse(
        await api("videos", {
          part: "snippet,contentDetails,status,statistics",
          id: ids.join(","),
        }),
      );
      for (const v of videos.items) {
        if (v.snippet.channelId !== expected) continue;
        const classified = classify(
          v.snippet.title + " " + v.snippet.description,
        );
        const existing = await db.content.findUnique({
          where: { youtubeId: v.id },
        });
        const data = {
          title: v.snippet.title,
          summary:
            v.snippet.description.slice(0, 700) || "Vídeo do canal de origem.",
          body: v.snippet.description,
          imageUrl:
            v.snippet.thumbnails.high?.url ||
            v.snippet.thumbnails.default?.url ||
            "",
          publishedAt: new Date(v.snippet.publishedAt),
          duration: v.contentDetails.duration,
          views: BigInt(v.statistics?.viewCount || "0"),
          externalAvailable:
            v.status.embeddable && v.status.privacyStatus === "public",
          channelId: expected,
          sourceUrl: `https://www.youtube.com/watch?v=${v.id}`,
          metadata: {
            classificationVersion: CLASSIFICATION_VERSION,
            channelTitle: channel.snippet.title,
            publishedAt: v.snippet.publishedAt,
          },
          ...(!existing?.manualCategories
            ? {
                categorySlugs: classified.categories,
                confidence: classified.confidence,
              }
            : {}),
        };
        await db.content.upsert({
          where: { youtubeId: v.id },
          update: data,
          create: {
            ...data,
            kind: "VIDEO",
            slug: slugify(v.snippet.title).slice(0, 100) + "-" + v.id,
            youtubeId: v.id,
            status: "PUBLISHED",
            author: channel.snippet.title,
          },
        });
        imported++;
      }
      await db.content.updateMany({
        where: {
          youtubeId: {
            in: ids.filter((id) => !videos.items.some((v) => v.id === id)),
          },
        },
        data: { externalAvailable: false },
      });
    }
    // Recheck one rotating batch of old videos, so removals outside the latest page are eventually detected.
    const old = await db.content.findMany({
      where: { channelId: expected, youtubeId: { not: null } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });
    if (old.length) {
      const checked = videosSchema.parse(
        await api("videos", {
          part: "snippet,contentDetails,status,statistics",
          id: old.map((v) => v.youtubeId).join(","),
        }),
      );
      for (const v of old) {
        const live = checked.items.find((i) => i.id === v.youtubeId);
        await db.content.update({
          where: { id: v.id },
          data: {
            externalAvailable:
              !!live &&
              live.status.embeddable &&
              live.status.privacyStatus === "public",
            updatedAt: new Date(),
          },
        });
      }
    }
    await db.channel.update({
      where: { id: expected },
      data: {
        lastSyncAt: new Date(),
        ...(mode === "backfill" || !saved.lastSyncAt
          ? { nextPageToken: page.nextPageToken || null }
          : {}),
      },
    });
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        imported,
        finishedAt: new Date(),
        message: `${imported} vídeos verificados; página ${mode}.`,
      },
    });
    return { imported, units };
  } catch (e) {
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        message:
          e instanceof AppError
            ? e.message
            : "Falha de conexão ou resposta inválida do YouTube.",
        finishedAt: new Date(),
      },
    });
    throw e;
  }
}
