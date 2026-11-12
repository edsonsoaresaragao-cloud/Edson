import {
  searchSchema,
  type SearchInput,
  type SearchResponse,
} from "./contracts";
import {
  partsQuerySchema,
  type PartsQuery,
  type PartsResult,
} from "../parts/catalog";
import { interpretQuery, normalize } from "./interpret";
import { z } from "zod";
export const intentSchema = z.enum([
  "buy",
  "diagnosis",
  "images",
  "videos",
  "codes",
  "manuals",
  "specifications",
  "learn",
]);
export type SearchIntent = z.infer<typeof intentSchema>;
export function searchIntent(q: string): SearchIntent {
  const s = normalize(q);
  if (/\b(comprar|compra|preco|barato|oferta|venda)\b/.test(s)) return "buy";
  if (/\b(imagem|imagens|foto|fotos)\b/.test(s)) return "images";
  if (/\b(video|videos)\b/.test(s)) return "videos";
  if (/\b(manual|manuais)\b/.test(s)) return "manuals";
  if (/\b[pcbu][0-9a-f]{4}\b/.test(s)) return "codes";
  if (
    interpretQuery(q).intent === "symptom" ||
    /\b(testar|diagnostico|falha|defeito|tensao elevada)\b/.test(s)
  )
    return "diagnosis";
  if (/\b(especificacao|especificacoes|tensao|corrente|pinagem)\b/.test(s))
    return "specifications";
  return "learn";
}
export function commercialInput(q: SearchInput, page = 1): PartsQuery {
  const i = interpretQuery(q.q);
  const term = i.corrected
    .replace(
      /\b(comprar|compra|preço|preco|barato|ofertas?|fotos?|imagens?|vídeos?|videos?|manual|manuais)\b/gi,
      " ",
    )
    .replace(/\bn[aã]o\s+(carrega|liga|pega|funciona)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return partsQuerySchema.parse({
    q: term || i.corrected,
    brand: q.brand,
    model: q.model,
    year: q.year,
    engine: q.engine,
    code: q.code,
    page,
  });
}
export type UnifiedResult = {
  version: 1;
  query: SearchInput;
  technical: SearchResponse | null;
  commercial: PartsResult | null;
  commercialQuery: PartsQuery;
  intent: SearchIntent;
  errors: { technical: string | null; commercial: string | null };
};
type Outcome<T> = { value: T | null; error: string | null };
export type UnifiedEvent =
  | {
      type: "meta";
      version: 1;
      query: SearchInput;
      commercialQuery: PartsQuery;
      intent: SearchIntent;
    }
  | { type: "technical"; outcome: Outcome<SearchResponse> }
  | { type: "commercial"; outcome: Outcome<PartsResult> }
  | { type: "complete" };
const optionsSchema = z.object({
  offerPage: z.coerce.number().int().min(1).max(5).default(1),
  stream: z.enum(["0", "1"]).default("0"),
  scope: z.enum(["all", "technical", "commercial"]).default("all"),
  tab: z
    .enum([
      "PEÇAS",
      "TODOS",
      "IMAGENS",
      "VÍDEOS",
      "DIAGNÓSTICO",
      "ESQUEMAS",
      "CÓDIGOS",
      "MANUAIS",
    ])
    .default("TODOS"),
  sort: z
    .enum(["relevance", "low", "high", "brand", "total"])
    .default("relevance"),
});
export function createUnifiedHandler(deps: {
  technical: (r: Request) => Promise<Response>;
  commercial: (r: Request) => Promise<Response>;
}) {
  return async (request: Request) => {
    const params = new URL(request.url).searchParams;
    const controls: Record<string, string> = {};
    for (const key of ["offerPage", "stream", "scope", "tab", "sort"]) {
      const value = params.get(key);
      if (value !== null) controls[key] = value;
      params.delete(key);
    }
    const options = optionsSchema.safeParse(controls),
      raw = Object.fromEntries(params);
    if (!raw.q?.trim() && (raw.code || "").trim().length >= 3)
      raw.q = raw.code.trim();
    const parsed = searchSchema.safeParse(raw);
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (!options.success || !parsed.success)
      return Response.json(
        { error: "Confira os termos, o ano e os filtros da pesquisa." },
        { status: 400, headers },
      );
    const q = parsed.data,
      purchase = commercialInput(q, options.data.offerPage),
      intent = searchIntent(q.q);
    async function consult(
      kind: "technical" | "commercial",
      query: Record<string, string | number>,
    ) {
      try {
        const url = new URL(request.url);
        url.search = new URLSearchParams(
          Object.entries(query).map(([k, v]) => [k, String(v)]),
        ).toString();
        const response = await deps[kind](
          new Request(url, {
            headers: request.headers,
            signal: request.signal,
          }),
        );
        const body = await response.json();
        if (
          (kind === "technical" &&
            body.version === 1 &&
            Array.isArray(body.sources)) ||
          (kind === "commercial" &&
            Array.isArray(body.offers) &&
            Array.isArray(body.sources))
        ) {
          if (kind === "commercial" && options.data!.sort !== "relevance") {
            const sort = options.data!.sort;
            body.offers = [...body.offers].sort(
              (
                a: PartsResult["offers"][number],
                b: PartsResult["offers"][number],
              ) =>
                sort === "brand"
                  ? (a.details?.brand || "\uffff").localeCompare(
                      b.details?.brand || "\uffff",
                      "pt-BR",
                    )
                  : sort === "total"
                    ? (a.details?.total ?? Infinity) -
                      (b.details?.total ?? Infinity)
                    : a.price === null
                      ? b.price === null
                        ? 0
                        : 1
                      : b.price === null
                        ? -1
                        : sort === "low"
                          ? a.price - b.price
                          : b.price - a.price,
            );
          }
          return { value: body, error: null };
        }
        return {
          value: null,
          error:
            response.status === 429
              ? "Limite de consultas atingido nesta categoria. Tente novamente mais tarde."
              : "Esta categoria não respondeu. Os demais resultados continuam disponíveis.",
        };
      } catch {
        console.warn("[automotive-search] source_failure", {
          provider: kind,
          reason: "unavailable",
        });
        return {
          value: null,
          error:
            "Esta categoria está indisponível. Os demais resultados foram preservados.",
        };
      }
    }
    const technical =
      options.data.scope === "commercial"
        ? Promise.resolve({ value: null, error: null })
        : consult("technical", q);
    const dtcOnly = intent === "codes" && !interpretQuery(q.q).name && !q.code;
    const commercial =
      options.data.scope === "technical"
        ? Promise.resolve({ value: null, error: null })
        : dtcOnly
          ? Promise.resolve({
              value: null,
              error:
                "Um código DTC não determina uma peça para comprar. Informe o nome da peça ou a referência OEM.",
            })
          : consult("commercial", purchase);
    if (options.data.stream === "1") {
      const encoder = new TextEncoder();
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const emit = (event: UnifiedEvent) => {
            if (!cancelled && !request.signal.aborted)
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          };
          emit({
            type: "meta",
            version: 1,
            query: q,
            commercialQuery: purchase,
            intent,
          });
          void Promise.all([
            technical.then((outcome) => emit({ type: "technical", outcome })),
            commercial.then((outcome) => emit({ type: "commercial", outcome })),
          ])
            .then(() => {
              emit({ type: "complete" });
              if (!cancelled) controller.close();
            })
            .catch(() => {
              if (!cancelled) controller.close();
            });
        },
        cancel() {
          cancelled = true;
        },
      });
      return new Response(stream, {
        headers: {
          ...headers,
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Accel-Buffering": "no",
        },
      });
    }
    const [t, c] = await Promise.all([technical, commercial]);
    const result: UnifiedResult = {
      version: 1,
      query: q,
      technical: t.value,
      commercial: c.value,
      commercialQuery: purchase,
      intent,
      errors: { technical: t.error, commercial: c.error },
    };
    return Response.json(result, {
      status: t.value || c.value ? 200 : 503,
      headers,
    });
  };
}
