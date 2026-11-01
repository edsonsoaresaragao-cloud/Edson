import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { syncYouTube } from "../src/lib/youtube";
import { randomBytes } from "node:crypto";
const channelId = "UCkwom28UGBpkHFeTvOsLN8w";
test(
  "YouTube controlado: valida identidade, deduplica e preserva correção manual",
  { timeout: 30000 },
  async () => {
    const originalFetch = globalThis.fetch,
      originalKey = process.env.YOUTUBE_API_KEY,
      originalHandle = process.env.YOUTUBE_HANDLE;
    const existingChannel = await db.channel.findUnique({
      where: { id: channelId },
    });
    const videoId = ("T" + randomBytes(8).toString("hex")).slice(0, 11);
    const started = new Date();
    let badIdentity = true;
    let includeVideo = true;
    process.env.YOUTUBE_API_KEY = "test-only-not-a-real-key";
    process.env.YOUTUBE_HANDLE = "@OficinaBrasil-Oficial";
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.split("/").pop();
      let result: unknown;
      if (endpoint === "channels")
        result = {
          items: [
            {
              id: badIdentity ? "incorrect" : channelId,
              snippet: { title: "Canal de teste controlado" },
              contentDetails: { relatedPlaylists: { uploads: "PL_TEST" } },
            },
          ],
        };
      else if (endpoint === "playlistItems")
        result = {
          items: [{ contentDetails: { videoId } }],
          nextPageToken: "NEXT_TEST",
        };
      else if (endpoint === "videos")
        result = {
          items: includeVideo
            ? [
                {
                  id: videoId,
                  snippet: {
                    title: "Sensor MAP de teste controlado",
                    description:
                      "Metadados artificiais somente para testar integração.",
                    publishedAt: "2026-01-01T00:00:00Z",
                    channelId,
                    thumbnails: {},
                  },
                  status: { embeddable: true, privacyStatus: "public" },
                  contentDetails: { duration: "PT1M" },
                  statistics: { viewCount: "10" },
                },
              ]
            : [],
        };
      else throw new Error("Endpoint inesperado no teste.");
      return Response.json(result);
    };
    try {
      await assert.rejects(syncYouTube(), /Identidade do canal/);
      assert.equal(
        await db.content.count({ where: { youtubeId: videoId } }),
        0,
      );
      badIdentity = false;
      await syncYouTube();
      let video = await db.content.findUniqueOrThrow({
        where: { youtubeId: videoId },
      });
      assert.ok(video.categorySlugs.includes("injecao-eletronica"));
      assert.equal(video.views, 10n);
      assert.equal(video.publishedAt.toISOString(), "2026-01-01T00:00:00.000Z");
      await db.content.update({
        where: { id: video.id },
        data: {
          manualCategories: true,
          categorySlugs: ["sensores-e-atuadores"],
          visibility: "PRIVATE",
        },
      });
      await syncYouTube("backfill");
      assert.equal(
        await db.content.count({ where: { youtubeId: videoId } }),
        1,
      );
      video = await db.content.findUniqueOrThrow({
        where: { youtubeId: videoId },
      });
      assert.deepEqual(video.categorySlugs, ["sensores-e-atuadores"]);
      assert.equal(video.visibility, "PRIVATE");
      includeVideo = false;
      await syncYouTube();
      video = await db.content.findUniqueOrThrow({
        where: { youtubeId: videoId },
      });
      assert.equal(video.externalAvailable, false);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
      else process.env.YOUTUBE_API_KEY = originalKey;
      if (originalHandle === undefined) delete process.env.YOUTUBE_HANDLE;
      else process.env.YOUTUBE_HANDLE = originalHandle;
      await db.content.deleteMany({ where: { youtubeId: videoId } });
      await db.syncRun.deleteMany({ where: { createdAt: { gte: started } } });
      if (existingChannel)
        await db.channel.update({
          where: { id: channelId },
          data: existingChannel,
        });
      else await db.channel.deleteMany({ where: { id: channelId } });
      await db.$disconnect();
    }
  },
);
