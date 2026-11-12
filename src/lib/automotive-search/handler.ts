import {
  searchSchema,
  type SearchResponse,
  type SearchInput,
} from "./contracts";
import { suggest, interpretQuery } from "./interpret";
export function createSearchHandler(deps: {
  search: (query: SearchInput) => Promise<SearchResponse>;
  guard: () => Promise<void>;
}) {
  return async (request: Request) => {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    try {
      const params = new URL(request.url).searchParams;
      if (params.get("suggest") === "1") {
        const q = (params.get("q") || "").slice(0, 250);
        return Response.json(
          { suggestions: suggest(q), correction: interpretQuery(q).corrected },
          { headers },
        );
      }
      const parsed = searchSchema.safeParse(Object.fromEntries(params));
      if (!parsed.success)
        return Response.json(
          {
            error:
              "Confira os campos da pesquisa: " +
              parsed.error.issues[0].message,
          },
          { status: 400, headers },
        );
      await deps.guard();
      const result = await deps.search(parsed.data);
      return Response.json(result, {
        status: result.status === "unavailable" ? 503 : 200,
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
          error: limited
            ? "Limite de pesquisas atingido. Tente novamente mais tarde."
            : "Pesquisa temporariamente indisponível. Tente novamente.",
        },
        { status: limited ? 429 : 503, headers },
      );
    }
  };
}
