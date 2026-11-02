import { partsQuerySchema, type PartsQuery, type PartsResult } from "./catalog";
type Dependencies = {
  search: (q: PartsQuery) => Promise<PartsResult>;
  guard?: () => Promise<void>;
};
export function createPartsSearchHandler({ search, guard }: Dependencies) {
  return async function GET(request: Request) {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const params = new URL(request.url).searchParams;
    const parsed = partsQuerySchema.safeParse(Object.fromEntries(params));
    if (!parsed.success)
      return Response.json(
        {
          error: "invalid_query",
          message: parsed.error.issues[0]?.message || "Pesquisa inválida.",
        },
        { status: 400, headers },
      );
    try {
      await guard?.();
      const result = await search(parsed.data);
      return Response.json(result, {
        status:
          result.status === "not_configured" || result.status === "unavailable"
            ? 503
            : 200,
        headers,
      });
    } catch (error) {
      const limited =
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 429;
      return Response.json(
        {
          error: limited ? "rate_limit" : "unavailable",
          message: limited
            ? "Muitas pesquisas. Aguarde um momento e tente novamente."
            : "A consulta de ofertas está temporariamente indisponível.",
        },
        { status: limited ? 429 : 503, headers },
      );
    }
  };
}
