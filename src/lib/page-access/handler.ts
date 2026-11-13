import { z } from "zod";
import { AccessError, type AccessRepository } from "./repository";
import { counterPath } from "./paths";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const inputSchema = z
  .object({
    path: z.string().max(240),
    eventId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
  })
  .strict();
async function bodyText(request: Request) {
  if (Number(request.headers.get("content-length")) > 1024)
    throw new AccessError("Solicitação muito grande.", 413);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new AccessError("Formato de solicitação inválido.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError("Solicitação inválida.");
  const decoder = new TextDecoder();
  let result = "",
    size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) {
        await reader.cancel();
        throw new AccessError("Solicitação muito grande.", 413);
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
}
export function createAccessHandlers(deps: {
  repository: () => AccessRepository;
  origin: () => string;
  guard?: (request: Request) => void;
}) {
  async function fail(error: unknown) {
    if (error instanceof AccessError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return Response.json(
        { error: "Solicitação de contagem inválida." },
        { status: 400, headers },
      );
    console.error("page_access_unavailable");
    return Response.json(
      { error: "Contador temporariamente indisponível." },
      { status: 503, headers },
    );
  }
  return {
    async GET(request: Request) {
      try {
        deps.guard?.(request);
        const path = counterPath(new URL(request.url).searchParams.get("path"));
        if (!path) throw new AccessError("Página inválida para contagem.");
        const repository = deps.repository();
        if (!(await repository.exists(path)))
          throw new AccessError("Página não encontrada.", 404);
        return Response.json(await repository.read(path), { headers });
      } catch (error) {
        return fail(error);
      }
    },
    async POST(request: Request) {
      try {
        const expected = new URL(deps.origin()).origin;
        if (
          request.headers.get("origin") !== expected ||
          request.headers.get("sec-fetch-site") === "cross-site"
        )
          throw new AccessError("Origem da solicitação não autorizada.", 403);
        deps.guard?.(request);
        const input = inputSchema.parse(JSON.parse(await bodyText(request))),
          path = counterPath(input.path);
        if (!path) throw new AccessError("Página inválida para contagem.");
        const repository = deps.repository();
        if (!(await repository.exists(path)))
          throw new AccessError("Página não encontrada.", 404);
        const ignored =
          /bot|crawler|spider|slurp|lighthouse|facebookexternalhit|whatsapp/i.test(
            request.headers.get("user-agent") || "",
          ) ||
          /prefetch/i.test(
            request.headers.get("sec-purpose") ||
              request.headers.get("purpose") ||
              "",
          ) ||
          request.headers.get("dnt") === "1" ||
          request.headers.get("sec-gpc") === "1";
        const counts = ignored
          ? await repository.read(path)
          : await repository.record(path, input.eventId);
        return Response.json({ ...counts, counted: !ignored }, { headers });
      } catch (error) {
        return fail(error);
      }
    },
  };
}
