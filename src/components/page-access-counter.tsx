"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Eye } from "lucide-react";
import {
  counterPath,
  validCounts,
  type AccessCounts,
} from "@/lib/page-access/paths";
function newEventId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function PageAccessCounter() {
  const pathname = usePathname(),
    path = counterPath(pathname);
  const receipt = useRef<{ path: string; id: string } | null>(null);
  const [retry, setRetry] = useState(0),
    [result, setResult] = useState<{
      path: string;
      phase: "loading" | "ready" | "error" | "hidden";
      counts?: AccessCounts;
    }>({ path: "", phase: "loading" });
  useEffect(() => {
    if (!path) {
      receipt.current = null;
      return;
    }
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    async function count() {
      try {
        if (receipt.current?.path !== path)
          receipt.current = { path: path!, id: newEventId() };
        const event = receipt.current;
        const response = await fetch("/api/page-access", {
          method: "POST",
          credentials: "omit",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: event.path, eventId: event.id }),
          signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 400 || response.status === 404) {
          setResult({ path: path!, phase: "hidden" });
          return;
        }
        const data = await response.json();
        if (!response.ok || !validCounts(data))
          throw new Error("counter_unavailable");
        if (active) setResult({ path: path!, phase: "ready", counts: data });
      } catch {
        if (active) setResult({ path: path!, phase: "error" });
      } finally {
        clearTimeout(timer);
      }
    }
    void count();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [path, retry]);
  if (!path || (result.path === path && result.phase === "hidden")) return null;
  const current = result.path === path ? result : null;
  const counts = current?.phase === "ready" ? current.counts : null;
  return (
    <div
      className="page-access-counter"
      role="group"
      aria-label="Contador de acessos"
    >
      <Eye size={18} aria-hidden="true" />
      {counts ? (
        <>
          <span>
            <strong data-counter="site">
              {BigInt(counts.total).toLocaleString("pt-BR")}
            </strong>{" "}
            {counts.total === "1" ? "acesso ao site" : "acessos ao site"}
          </span>
          <span className="page-access-separator" aria-hidden="true">
            ·
          </span>
          <span>
            <strong data-counter="page">
              {BigInt(counts.page).toLocaleString("pt-BR")}
            </strong>{" "}
            nesta página
          </span>
        </>
      ) : current?.phase === "error" ? (
        <>
          <span>Contador temporariamente indisponível.</span>
          <button
            type="button"
            onClick={() => {
              setResult({ path, phase: "loading" });
              setRetry((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </>
      ) : (
        <span>Carregando acessos…</span>
      )}
    </div>
  );
}
