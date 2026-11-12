import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyInput,
  searchSchema,
  type SearchSource,
} from "../src/lib/automotive-search/contracts";
import {
  interpretQuery,
  suggest,
  localReferences,
} from "../src/lib/automotive-search/interpret";
import {
  jobsFor,
  parseJob,
  rankSources,
} from "../src/lib/automotive-search/providers";
import { groundAnswer } from "../src/lib/automotive-search/ai";
import {
  createAutomotiveSearch,
  searchCacheKey,
} from "../src/lib/automotive-search/service";
import { createSearchHandler } from "../src/lib/automotive-search/handler";
import { createHistoryHandler } from "../src/lib/automotive-search/history-handler";
import { AutomotiveSearch } from "../src/components/automotive-search/search";
const query = {
  ...emptyInput,
  q: "sensor MAP",
  model: "HB20",
  year: "2026",
  engine: "1.0",
};
const source = (
  id = "S1",
  host = "www.boschaftermarket.com",
): SearchSource => ({
  id,
  host,
  url: "https://" + host + "/sensor-map",
  title: "Sensor MAP diagnóstico",
  snippet:
    "Sensor mede pressão absoluta. Alimentação conforme aplicação; exemplo 5 V. DTC P0106 é hipótese.",
  provider: "google-web",
  kind: "diagnosis",
  image: null,
  imagePage: null,
  published: null,
  score: 0,
});
const google = {
  AUTOMOTIVE_GOOGLE_API_KEY: "PRIVATE_SEARCH_KEY",
  AUTOMOTIVE_GOOGLE_CX: "cx-test",
};
test("interpretação reconhece nomes populares, siglas, sintomas e erros sem inferir aplicação", () => {
  const i = interpretQuery("senso MAP HB20 2026");
  assert.match(i.corrected, /sensor MAP/);
  assert.match(i.name!, /MAP/);
  assert.equal(i.intent, "part");
  assert.equal(interpretQuery("alternador nao carrega").intent, "symptom");
  assert.equal(interpretQuery("P0106").intent, "code");
  assert.ok(suggest("sensor m").length);
  assert.ok(localReferences("sensor MAP").length);
  assert.equal(interpretQuery("componente inexistente QZX").name, null);
  assert.equal(
    searchSchema.safeParse({ ...query, year: "2026abc" }).success,
    false,
  );
});
test("jobs usam APIs autorizadas, filtros de veículo e host fixo; chaves não vão para resultados", () => {
  const jobs = jobsFor(
    { ...query, source: "bosch" },
    { ...google, YOUTUBE_API_KEY: "YT_SECRET" },
  );
  assert.equal(jobs.length, 3);
  assert.ok(jobs[0].url.searchParams.get("q")?.includes("HB20 2026 1.0"));
  assert.ok(
    jobs[0].url.searchParams.get("q")?.includes("site:boschaftermarket.com"),
  );
  assert.equal(jobs[1].url.searchParams.get("searchType"), "image");
  assert.equal(jobs[2].url.hostname, "www.googleapis.com");
  assert.equal(jobsFor(query, {}).length, 0);
  assert.notEqual(
    searchCacheKey(query, google),
    searchCacheKey(query, {
      ...google,
      AUTOMOTIVE_GOOGLE_CX: "outro-mecanismo",
    }),
  );
});
test("parsers aceitam páginas, imagens atribuídas e vídeos oficiais; rejeitam URLs perigosas", () => {
  const jobs = jobsFor(query, { ...google, YOUTUBE_API_KEY: "YT" });
  const web = parseJob(jobs[0], {
    items: [
      {
        title: "Sensor MAP",
        link: "https://www.boschaftermarket.com/map?utm_source=x",
        snippet: "Pressão absoluta",
      },
      { title: "malicioso", link: "http://127.0.0.1/private" },
      { title: "segredo", link: "https://www.bosch.com/map?api_key=secret" },
    ],
  });
  assert.equal(web.sources.length, 1);
  assert.equal(web.sources[0].url, "https://www.boschaftermarket.com/map");
  const image = parseJob(jobs[1], {
    items: [
      {
        title: "Sensor",
        link: "https://www.bosch.com/map.jpg",
        image: { contextLink: "https://www.bosch.com/map" },
      },
      { title: "ruim", link: "javascript:alert(1)" },
    ],
  });
  assert.equal(image.images.length, 1);
  assert.equal(image.images[0].page, "https://www.bosch.com/map");
  const videos = parseJob(jobs[2], {
    items: [
      {
        id: { videoId: "abcdefghijk" },
        snippet: {
          title: "Ensaio MAP",
          description: "Teste",
          publishedAt: "2026-01-02T00:00:00Z",
        },
      },
      { id: { videoId: "bad/url" }, snippet: { title: "x" } },
    ],
  });
  assert.equal(videos.sources.length, 1);
  assert.equal(
    videos.sources[0].url,
    "https://www.youtube.com/watch?v=abcdefghijk",
  );
});
test("deduplicação e relevância favorecem fabricante sem inventar concordância entre fontes", () => {
  const a = source(),
    b = source("S2", "www.denso.com"),
    c = {
      ...source("S3", "some-site.com"),
      title: "Notícia sem relação",
      snippet: "",
    };
  const ranked = rankSources([a, a, b, c], query);
  assert.equal(ranked.length, 3);
  assert.ok(ranked[0].score > ranked[2].score);
  assert.equal(rankSources([a, b], { ...query, source: "bosch" }).length, 1);
});
test("IA só mantém fatos com IDs existentes e números/códigos presentes nos trechos", () => {
  const raw = {
    summary: "Texto não confiável sem fonte",
    facts: [
      {
        category: "function",
        text: "Mede pressão absoluta.",
        sourceIds: ["S1"],
        status: "general",
      },
      {
        category: "technical",
        text: "Usa 12 V.",
        sourceIds: ["S1"],
        status: "general",
      },
      {
        category: "codes",
        text: "Falha P9999.",
        sourceIds: ["S1"],
        status: "general",
      },
      {
        category: "function",
        text: "Afirmação sem fonte.",
        sourceIds: ["inventada"],
        status: "general",
      },
      {
        category: "application",
        text: "Aplicação para veículo.",
        sourceIds: ["S1"],
        status: "general",
      },
    ],
    missing: [],
    related: [],
  };
  const answer = groundAnswer(raw, [source()]);
  assert.equal(answer.facts.length, 2);
  assert.equal(answer.facts[1].status, "unconfirmed");
  assert.notEqual(answer.summary, raw.summary);
});
test("sem configuração não chama rede ou IA nem apresenta resposta inventada", async () => {
  let calls = 0;
  const search = createAutomotiveSearch({
    fetcher: async () => {
      calls++;
      throw new Error();
    },
  });
  const result = await search(query, {});
  assert.equal(calls, 0);
  assert.equal(result.status, "not_configured");
  assert.equal(result.answer, null);
  assert.ok(result.localReferences.length);
});
test("busca real pelo adaptador, cache, coalescência e síntese usam só evidências retornadas", async () => {
  let calls = 0,
    budget = 0;
  let sent = "";
  const search = createAutomotiveSearch({
    beforeCall: async () => {
      budget++;
    },
    fetcher: async (input, init) => {
      calls++;
      const url = String(input);
      if (url.includes("openai.com")) {
        sent = String(init?.body);
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "Resumo",
                  facts: [
                    {
                      category: "function",
                      text: "Sensor mede pressão absoluta.",
                      sourceIds: [
                        JSON.parse(sent).messages[1].content
                          ? JSON.parse(JSON.parse(sent).messages[1].content)
                              .sources[0].id
                          : "",
                      ],
                      status: "general",
                    },
                  ],
                  missing: [],
                  related: ["sensor MAP diagnóstico"],
                }),
              },
            },
          ],
        });
      }
      return Response.json(
        url.includes("searchType=image")
          ? { items: [] }
          : {
              items: [
                {
                  title: "Sensor MAP",
                  link: "https://www.bosch.com/sensor-map",
                  snippet: "Sensor mede pressão absoluta.",
                },
              ],
            },
      );
    },
  });
  const env = { ...google, OPENAI_API_KEY: "PRIVATE_AI_KEY" };
  const [a, b] = await Promise.all([search(query, env), search(query, env)]);
  assert.equal(calls, 3);
  assert.equal(budget, 3);
  assert.equal(a.ai, "ready");
  assert.equal(a.answer?.facts.length, 1);
  assert.equal(b.cached, true);
  const cached = await search(query, env);
  assert.equal(calls, 3);
  assert.equal(cached.cached, true);
  assert.doesNotMatch(JSON.stringify(a), /PRIVATE_AI_KEY|PRIVATE_SEARCH_KEY/);
  assert.match(sent, /EXCLUSIVAMENTE/);
});
test("quota, respostas grandes e falhas parciais preservam fontes e não expõem erros internos", async () => {
  const search = createAutomotiveSearch({
    fetcher: async (input) =>
      String(input).includes("searchType=image")
        ? new Response("limite", { status: 429 })
        : Response.json({
            items: [
              {
                title: "Página",
                link: "https://www.denso.com/map",
                snippet: "Informação",
              },
            ],
          }),
  });
  const result = await search(query, google);
  assert.equal(result.status, "partial");
  assert.equal(result.sources.length, 1);
  assert.equal(
    result.providers.find((p) => p.id === "google-image")?.state,
    "limited",
  );
  const down = createAutomotiveSearch({
    fetcher: async () => {
      throw new Error("SECRET_DATABASE_PASSWORD");
    },
  });
  const failed = await down(query, google);
  assert.equal(failed.status, "unavailable");
  assert.doesNotMatch(JSON.stringify(failed), /SECRET_DATABASE/);
});
test("ausência de resultados não chama IA, e cache persistente é reaproveitado", async () => {
  let ai = 0;
  const search = createAutomotiveSearch({
    fetcher: async (input) => {
      if (String(input).includes("openai")) ai++;
      return Response.json({ items: [] });
    },
  });
  const result = await search(query, { ...google, OPENAI_API_KEY: "x" });
  assert.equal(result.status, "empty");
  assert.equal(result.ai, "no_evidence");
  assert.equal(ai, 0);
  const reused = createAutomotiveSearch({
    cache: {
      get: async () => ({ ...result, queriedAt: new Date().toISOString() }),
      put: async () => {},
    },
    fetcher: async () => {
      throw new Error("Não deve consultar");
    },
  });
  assert.equal((await reused(query, google)).storage, "database");
});
test("handler valida filtros, sugestões e limites e retorna erros sanitizados", async () => {
  const search = createAutomotiveSearch();
  const handler = createSearchHandler({
    search: (q) => search(q, {}),
    guard: async () => {},
  });
  assert.equal(
    (await handler(new Request("https://edson.com/api?q=sensor&year=bad")))
      .status,
    400,
  );
  const suggestions = await (
    await handler(new Request("https://edson.com/api?suggest=1&q=sensor%20map"))
  ).json();
  assert.ok(suggestions.suggestions.length);
  const limited = createSearchHandler({
    search: (q) => search(q, {}),
    guard: async () => {
      throw { status: 429, password: "private" };
    },
  });
  const response = await limited(new Request("https://edson.com/api?q=sensor"));
  assert.equal(response.status, 429);
  assert.doesNotMatch(await response.text(), /private/);
});
test("histórico exige usuário, protege origem, valida corpo e usa somente proprietário autenticado", async () => {
  let owner = "",
    writes = 0;
  const store = {
    history: async (id: string) => {
      owner = id;
      return [];
    },
    save: async (id: string) => {
      owner = id;
      writes++;
      return "saved";
    },
    clear: async (id: string) => {
      owner = id;
    },
  };
  const denied = createHistoryHandler(store, async () => {
    throw Object.assign(new Error("Entre na conta"), { status: 401 });
  });
  assert.equal(
    (await denied(new Request("https://edson.com/history"))).status,
    401,
  );
  const handler = createHistoryHandler(store, async () => ({ id: "owner-a" }));
  assert.equal(
    (await handler(new Request("https://edson.com/history?owner=other")))
      .status,
    200,
  );
  assert.equal(owner, "owner-a");
  assert.equal(
    (
      await handler(
        new Request("https://edson.com/history", {
          method: "POST",
          body: "not json",
        }),
      )
    ).status,
    400,
  );
  assert.equal(writes, 0);
  assert.equal(
    (
      await handler(
        new Request("https://edson.com/history", {
          method: "POST",
          body: JSON.stringify(query),
        }),
      )
    ).status,
    201,
  );
  assert.equal(owner, "owner-a");
});
test("HTML inicial tem uma busca, filtros e privacidade do histórico sem simular ofertas", () => {
  const html = renderToStaticMarkup(createElement(AutomotiveSearch));
  assert.match(html, /O que você procura para seu veículo\?/);
  assert.equal((html.match(/<form/g) || []).length, 1);
  assert.match(html, /Guardar pesquisas neste navegador/);
  assert.match(html, /Fonte técnica \(web\)/);
  assert.doesNotMatch(html, /PRIVATE_SEARCH_KEY|Resposta inventada/);
});

test("filtro de fabricante também restringe a origem das imagens", async () => {
  const search = createAutomotiveSearch({
    fetcher: async (input) =>
      Response.json(
        String(input).includes("searchType=image")
          ? {
              items: [
                {
                  title: "MAP Bosch",
                  link: "https://www.bosch.com/map.jpg",
                  image: { contextLink: "https://www.bosch.com/map" },
                },
                {
                  title: "MAP outra fonte",
                  link: "https://www.denso.com/map.jpg",
                  image: { contextLink: "https://www.denso.com/map" },
                },
              ],
            }
          : { items: [] },
      ),
  });
  const result = await search({ ...query, source: "bosch" }, google);
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].title, "MAP Bosch");
});
