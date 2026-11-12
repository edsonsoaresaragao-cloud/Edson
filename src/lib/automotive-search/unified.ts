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
export type SearchIntent =
  | "buy"
  | "diagnosis"
  | "images"
  | "videos"
  | "codes"
  | "manuals"
  | "specifications"
  | "learn";
export function searchIntent(q: string): SearchIntent {
  const s = normalize(q);
  if (/\b(comprar|compra|preco|barato|oferta|venda)\b/.test(s)) return "buy";
  if (/\b(imagem|imagens|foto|fotos)\b/.test(s)) return "images";
  if (/\b(video|videos)\b/.test(s)) return "videos";
  if (/\b(manual|manuais)\b/.test(s)) return "manuals";
  if (/\b[pcbu][0-9a-f]{4}\b/.test(s)) return "codes";
  if (
    interpretQuery(q).intent === "symptom" ||
    /\b(testar|diagnostico|falha|defeito)\b/.test(s)
  )
    return "diagnosis";
  if (/\b(especificacao|especificacoes|tensao|corrente|pinagem)\b/.test(s))
    return "specifications";
  return "learn";
}
export function commercialInput(q: SearchInput, page = 1): PartsQuery {
  const i = interpretQuery(q.q);
  // Keep vehicle names embedded in free text. Remove intent phrases, never infer
  // an OEM/application or pick a replacement from a DTC alone.
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
export function createUnifiedHandler(deps: {
  technical: (request: Request) => Promise<Response>;
  commercial: (request: Request) => Promise<Response>;
}) {
  return async (request: Request) => {
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("offerPage") || 1);
    params.delete("offerPage");
    const raw = Object.fromEntries(params);
    if (!raw.q?.trim() && (raw.code || "").trim().length >= 3)
      raw.q = raw.code.trim();
    const parsed = searchSchema.safeParse(raw);
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (!parsed.success || !Number.isInteger(page) || page < 1 || page > 5)
      return Response.json(
        { error: "Confira os termos, o ano e os filtros da pesquisa." },
        { status: 400, headers },
      );
    const q = parsed.data,
      purchase = commercialInput(q, page);
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
          new Request(url, { headers: request.headers }),
        );
        const body = await response.json();
        if (
          (kind === "technical" &&
            body.version === 1 &&
            Array.isArray(body.sources)) ||
          (kind === "commercial" &&
            Array.isArray(body.offers) &&
            Array.isArray(body.sources))
        )
          return { value: body, error: null };
        return {
          value: null,
          error:
            response.status === 429
              ? "Limite de consultas atingido nesta fonte."
              : "Esta fonte não respondeu à pesquisa. Tente novamente.",
        };
      } catch {
        console.warn("[automotive-search] source_failure", {
          provider: kind,
          reason: "unavailable",
        });
        return {
          value: null,
          error:
            "Esta fonte está indisponível. Os demais resultados foram preservados.",
        };
      }
    }
    const [technical, commercial] = await Promise.all([
      consult("technical", q),
      !q.code &&
      /^(?:c[oó]digo(?: de falha)?\s*)?[PCBU][0-9A-F]{4}$/i.test(q.q.trim())
        ? Promise.resolve({
            value: null,
            error:
              "Um código DTC não determina uma peça para comprar. Informe o nome da peça ou a referência OEM.",
          })
        : consult("commercial", purchase),
    ]);
    const result: UnifiedResult = {
      version: 1,
      query: q,
      technical: technical.value,
      commercial: commercial.value,
      commercialQuery: purchase,
      intent: searchIntent(q.q),
      errors: { technical: technical.error, commercial: commercial.error },
    };
    return Response.json(result, {
      status: technical.value || commercial.value ? 200 : 503,
      headers,
    });
  };
}
