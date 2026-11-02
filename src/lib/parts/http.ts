export class PartsQuotaError extends Error {}

export async function readPartsResponse(
  response: Response,
  maxBytes = 2_000_000,
): Promise<string> {
  if (response.status === 429) {
    await response.body?.cancel();
    throw new PartsQuotaError();
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("upstream_failed");
  }
  if (Number(response.headers.get("content-length") || 0) > maxBytes) {
    await response.body?.cancel();
    throw new Error("oversized_response");
  }
  if (!response.body) throw new Error("invalid_response");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("oversized_response");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
