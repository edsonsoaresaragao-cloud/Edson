import { searchSchema, type SearchInput } from "./contracts";
export function createHistoryHandler(
  store: {
    history: (owner: string) => Promise<unknown>;
    save: (owner: string, q: SearchInput) => Promise<string>;
    clear: (owner: string) => Promise<void>;
  },
  guard: (request: Request, write: boolean) => Promise<{ id: string }>,
) {
  return async (request: Request) => {
    const headers = { "Cache-Control": "no-store" };
    try {
      const user = await guard(request, request.method !== "GET");
      if (request.method === "GET")
        return Response.json(
          { history: await store.history(user.id) },
          { headers },
        );
      if (request.method === "DELETE") {
        await store.clear(user.id);
        return Response.json({ ok: true }, { headers });
      }
      const text = await request.text();
      if (text.length > 5000)
        return Response.json(
          { error: "Pesquisa muito grande." },
          { status: 413, headers },
        );
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return Response.json(
          { error: "JSON inválido." },
          { status: 400, headers },
        );
      }
      const parsed = searchSchema.safeParse(body);
      if (!parsed.success)
        return Response.json(
          { error: "Pesquisa inválida." },
          { status: 400, headers },
        );
      return Response.json(
        { id: await store.save(user.id, parsed.data) },
        { status: 201, headers },
      );
    } catch (e) {
      const status =
        e && typeof e === "object" && "status" in e ? Number(e.status) : 503;
      return Response.json(
        {
          error:
            status < 500 && e instanceof Error
              ? e.message
              : "Não foi possível acessar o histórico.",
        },
        { status, headers },
      );
    }
  };
}
