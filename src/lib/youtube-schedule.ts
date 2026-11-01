/** Keep new uploads flowing while the older archive is still importing. */
export function youtubeSyncMode(
  hasArchivePage: boolean,
  lastLatest: Date | null,
  now: number,
  intervalMinutes: number,
): "latest" | "backfill" {
  const interval = Number.isFinite(intervalMinutes)
    ? Math.max(15, intervalMinutes)
    : 360;
  return !hasArchivePage ||
    !lastLatest ||
    now - lastLatest.getTime() >= interval * 60000
    ? "latest"
    : "backfill";
}
