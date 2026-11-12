import type { UnifiedEvent, UnifiedResult } from "./unified";
/** Consume progressive results; JSON support keeps API clients and fixtures compatible. */
export async function readUnifiedEvents(
  response: Response,
  emit: (event: UnifiedEvent) => void,
) {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const body = (await response.json()) as UnifiedResult & { error?: string };
    if (body.version !== 1)
      throw new Error(body.error || "Não foi possível pesquisar agora.");
    emit({
      type: "meta",
      version: 1,
      query: body.query,
      commercialQuery: body.commercialQuery,
      intent: body.intent,
    });
    emit({
      type: "technical",
      outcome: { value: body.technical, error: body.errors.technical },
    });
    emit({
      type: "commercial",
      outcome: { value: body.commercial, error: body.errors.commercial },
    });
    emit({ type: "complete" });
    return;
  }
  if (!response.body) throw new Error("A pesquisa não devolveu resultados.");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    size = 0,
    complete = false;
  function line(value: string) {
    if (!value.trim()) return;
    const event = JSON.parse(value) as UnifiedEvent;
    if (!["meta", "technical", "commercial", "complete"].includes(event.type))
      throw new Error("Resposta de pesquisa inválida.");
    if (event.type === "complete") complete = true;
    emit(event);
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4_000_000) {
        await reader.cancel();
        throw new Error("Resposta da pesquisa muito grande. Refine o termo.");
      }
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        line(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) line(buffer);
    if (!complete)
      throw new Error(
        "A conexão foi interrompida. Os resultados recebidos foram preservados.",
      );
  } finally {
    reader.releaseLock();
  }
}
