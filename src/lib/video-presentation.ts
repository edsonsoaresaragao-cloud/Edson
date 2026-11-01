/** Original publication date, with deterministic pagination for equal dates. */
export const recentContentOrder = [
  { publishedAt: "desc" as const },
  { id: "desc" as const },
];
export function videoDate(metadata: unknown): string | null {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("publishedAt" in metadata) ||
    typeof metadata.publishedAt !== "string"
  )
    return null;
  const date = new Date(metadata.publishedAt);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
export function durationLabel(value: string | null): string | null {
  const m = value?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m || !m.slice(1).some(Boolean)) return null;
  return m[1]
    ? `${m[1]}:${(m[2] || "0").padStart(2, "0")}:${(m[3] || "0").padStart(2, "0")}`
    : `${Number(m[2] || 0)}:${(m[3] || "0").padStart(2, "0")}`;
}
export function shortSummary(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function publicationLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
