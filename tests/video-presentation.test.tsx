import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecentVideos } from "../src/components/recent-videos";
import {
  videoDate,
  durationLabel,
  shortSummary,
  recentContentOrder,
} from "../src/lib/video-presentation";
test("ordenação usa publicação original e desempate estável", () =>
  assert.deepEqual(recentContentOrder, [
    { publishedAt: "desc" },
    { id: "desc" },
  ]));
test("data inválida nunca é inventada e duração aceita horas", () => {
  assert.equal(videoDate({ publishedAt: "inválida" }), null);
  assert.equal(videoDate(null), null);
  assert.equal(
    videoDate({ publishedAt: "2026-10-31T15:00:00Z" }),
    "2026-10-31T15:00:00.000Z",
  );
  assert.equal(durationLabel("PT1H2M3S"), "1:02:03");
  assert.equal(durationLabel("PT45S"), "0:45");
  assert.equal(durationLabel(null), null);
});
test("vitrine mantém links, data de origem e filtro acessível sem descrição promocional longa", () => {
  const summary = shortSummary(
    "Aprenda freios. https://example.com/abc  Mais dicas.",
  );
  assert.equal(summary, "Aprenda freios. Mais dicas.");
  const html = renderToStaticMarkup(
    createElement(RecentVideos, {
      videos: [
        {
          id: "1",
          slug: "freios",
          title: "Freios modernos",
          summary,
          author: "Oficina",
          imageUrl: "",
          categories: ["freios-e-abs"],
          duration: "PT8M1S",
          metadata: { publishedAt: "2026-10-31T15:00:00Z" },
        },
      ],
    }),
  );
  assert.ok(html.includes('href="/videos/freios"'));
  assert.ok(html.includes("8:01"));
  assert.ok(html.includes("2026-10-31"));
  assert.ok(html.includes('aria-pressed="true"'));
  assert.ok(html.includes('aria-live="polite"'));
});

test("arquivo antigo não impede sincronização periódica de novidades", async () => {
  const { youtubeSyncMode } = await import("../src/lib/youtube-schedule");
  const now = Date.UTC(2026, 10, 1);
  assert.equal(youtubeSyncMode(true, null, now, 360), "latest");
  assert.equal(
    youtubeSyncMode(true, new Date(now - 3600000), now, 360),
    "backfill",
  );
  assert.equal(
    youtubeSyncMode(true, new Date(now - 7 * 3600000), now, 360),
    "latest",
  );
  assert.equal(youtubeSyncMode(false, new Date(now), now, 360), "latest");
});
