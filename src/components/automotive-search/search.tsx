"use client";
import Link from "next/link";
import { PartsMarketplace } from "@/components/parts-marketplace";
import { VehicleFilters } from "./vehicle-filters";
import type { PartsQuery, PartsResult } from "@/lib/parts/catalog";
import type {
  SearchIntent,
  UnifiedEvent,
} from "@/lib/automotive-search/unified";
import { readUnifiedEvents } from "@/lib/automotive-search/stream";
import { imageKind } from "@/lib/automotive-search/media";
import { DiagnosticEvidence } from "./evidence";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  emptyInput,
  searchSchema,
  type SearchInput,
  type SearchResponse,
  type SearchSource,
  type MediaResult,
} from "@/lib/automotive-search/contracts";
const tabs = [
  "PEÇAS",
  "TODOS",
  "IMAGENS",
  "VÍDEOS",
  "DIAGNÓSTICO",
  "ESQUEMAS",
  "CÓDIGOS",
  "MANUAIS",
];
const categoryLabels: Record<string, string> = {
  identification: "Identificação",
  function: "Funcionamento",
  technical: "Informações técnicas",
  application: "Aplicação",
  diagnosis: "Falhas e diagnóstico",
  codes: "Códigos e referências",
  repair: "Inspeção e reparo",
  safety: "Cuidados",
  divergence: "Divergências entre fontes",
  tools: "Ferramentas citadas",
  tests: "Sequência de verificações",
  decision: "Interpretação e critérios de decisão",
  symptoms: "Sintomas relacionados",
  location: "Localização",
};
function Picture({
  image,
  title,
  page,
}: {
  image: string;
  title: string;
  page: string;
}) {
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="auto-picture">
      {failed ? (
        <p>Imagem indisponível na fonte.</p>
      ) : (
        <button
          type="button"
          aria-label={`Ampliar: ${title}`}
          onClick={() => dialog.current?.showModal()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        </button>
      )}
      <dialog
        ref={dialog}
        className="auto-image-dialog"
        aria-label={`Imagem ampliada: ${title}`}
      >
        <button type="button" onClick={() => dialog.current?.close()}>
          Fechar imagem
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <p>
          <a href={page} target="_blank" rel="noopener noreferrer">
            {title} · fonte original ↗
          </a>
        </p>
      </dialog>
      <figcaption>
        <a href={page} target="_blank" rel="noopener noreferrer">
          {title} · fonte original ↗
        </a>
      </figcaption>
    </figure>
  );
}
function purchaseUrl(query: PartsQuery) {
  const url = new URL(window.location.href);
  const fields = {
    buy: query.q,
    carBrand: query.brand,
    carModel: query.model,
    carYear: query.year,
    carEngine: query.engine,
    partCode: query.code,
    buyPage: query.page > 1 ? String(query.page) : "",
  };
  for (const [k, v] of Object.entries(fields)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
export function AutomotiveSearch({
  initial = "",
  purchaseInitial = {},
}: {
  initial?: string;
  purchaseInitial?: Record<string, string | undefined>;
} = {}) {
  const id = useId(),
    [draft, setDraft] = useState<SearchInput>({ ...emptyInput, q: initial }),
    [data, setData] = useState<SearchResponse | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState(1),
    [commercial, setCommercial] = useState<PartsResult | null>(null),
    [commercialQuery, setCommercialQuery] = useState<PartsQuery | null>(null),
    [commercialBusy, setCommercialBusy] = useState(false),
    [commercialError, setCommercialError] = useState(""),
    [playing, setPlaying] = useState<string | null>(null),
    [imageFilter, setImageFilter] = useState("all"),
    [suggestions, setSuggestions] = useState<string[]>([]),
    [focused, setFocused] = useState(false),
    [keep, setKeep] = useState(false),
    [history, setHistory] = useState<SearchInput[]>([]),
    [notice, setNotice] = useState("");
  const activeQuery = useRef<SearchInput | null>(null);
  const tabTouched = useRef(false),
    commercialGeneration = useRef(0),
    commercialController = useRef<AbortController | null>(null);
  const generation = useRef(0),
    controller = useRef<AbortController | null>(null),
    initialRun = useRef(false),
    results = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    if (draft.q.trim().length < 2) return;
    const timer = setTimeout(() => {
      fetch(
        "/api/automotive-search?suggest=1&q=" + encodeURIComponent(draft.q),
        { signal: abort.signal },
      )
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((body) =>
          setSuggestions(
            Array.isArray(body.suggestions)
              ? body.suggestions
                  .filter((v: unknown) => typeof v === "string")
                  .slice(0, 7)
              : [],
          ),
        )
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [draft.q]);
  useEffect(
    () => () => {
      controller.current?.abort();
      commercialController.current?.abort();
    },
    [],
  );
  const purchaseSearch = useCallback(async (query: PartsQuery) => {
    commercialController.current?.abort();
    const abort = new AbortController();
    commercialController.current = abort;
    const current = ++commercialGeneration.current;
    setCommercialQuery(query);
    setCommercial(null);
    setCommercialBusy(true);
    setCommercialError("");
    purchaseUrl(query);
    try {
      const params = new URLSearchParams({
        q: query.q,
        brand: query.brand,
        model: query.model,
        year: query.year,
        engine: query.engine,
        code: query.code,
        source: "all",
        offerPage: String(query.page),
        scope: "commercial",
        stream: "1",
      });
      const response = await fetch("/api/automotive-search/unified?" + params, {
        signal: abort.signal,
        cache: "no-store",
      });
      await readUnifiedEvents(response, (event) => {
        if (current !== commercialGeneration.current || abort.signal.aborted)
          return;
        if (event.type === "commercial") {
          setCommercial(event.outcome.value);
          setCommercialError(event.outcome.error || "");
        }
      });
    } catch (e) {
      if (current === commercialGeneration.current && !abort.signal.aborted)
        setCommercialError(
          e instanceof Error ? e.message : "Consulta de ofertas indisponível.",
        );
    } finally {
      if (current === commercialGeneration.current) setCommercialBusy(false);
    }
  }, []);
  const run = useCallback(
    async (
      input: SearchInput,
      offerPage = 1,
      scope: "all" | "technical" = "all",
    ) => {
      const parsed = searchSchema.safeParse({
        ...input,
        q:
          input.q.trim() ||
          (input.code.trim().length >= 3 ? input.code.trim() : ""),
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      const query = parsed.data;
      if (scope === "all") activeQuery.current = query;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      const current = ++generation.current;
      setDraft(query);
      setBusy(true);
      setData(null);
      setError("");
      if (scope === "all") {
        tabTouched.current = false;
        setTab(1);
        setPlaying(null);
        commercialController.current?.abort();
        ++commercialGeneration.current;
        setCommercial(null);
        setCommercialQuery(null);
        setCommercialBusy(true);
        setCommercialError("");
        setImageFilter("all");
      }
      setFocused(false);
      setNotice("");
      const url = new URL(window.location.href);
      url.searchParams.set("auto", query.q);
      for (const key of [
        "brand",
        "model",
        "year",
        "engine",
        "code",
        "source",
      ] as const) {
        const value = query[key];
        if (value && value !== "all")
          url.searchParams.set("auto_" + key, value);
        else url.searchParams.delete("auto_" + key);
      }
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
      let receivedTechnical = false,
        receivedCommercial = false;
      try {
        const response = await fetch(
          "/api/automotive-search/unified?" +
            new URLSearchParams({
              ...query,
              offerPage: String(offerPage),
              stream: "1",
              scope,
            }),
          { signal: abort.signal, cache: "no-store" },
        );
        function chooseIntent(intent: SearchIntent | undefined) {
          if (intent && !tabTouched.current && scope === "all")
            setTab(
              {
                buy: 0,
                learn: 1,
                images: 2,
                videos: 3,
                diagnosis: 4,
                specifications: 1,
                codes: 6,
                manuals: 7,
              }[intent] ?? 1,
            );
        }
        await readUnifiedEvents(response, (event: UnifiedEvent) => {
          if (current !== generation.current || abort.signal.aborted) return;
          if (event.type === "meta") {
            if (scope === "all") {
              setCommercialQuery(event.commercialQuery);
              purchaseUrl(event.commercialQuery);
              chooseIntent(event.intent);
            }
          } else if (event.type === "technical") {
            receivedTechnical = true;
            setData(event.outcome.value);
            setError(event.outcome.error || "");
            setBusy(false);
            chooseIntent(event.outcome.value?.answer?.intent);
          } else if (event.type === "commercial" && scope === "all") {
            receivedCommercial = true;
            setCommercial(event.outcome.value);
            setCommercialError(event.outcome.error || "");
            setCommercialBusy(false);
          }
        });
        if (current !== generation.current || abort.signal.aborted) return;
        if (keep) {
          const recent = [
            query,
            ...history.filter(
              (v) => JSON.stringify(v) !== JSON.stringify(query),
            ),
          ].slice(0, 12);
          setHistory(recent);
          try {
            localStorage.setItem("edson-auto-history", JSON.stringify(recent));
          } catch {
            setNotice("Não foi possível gravar o histórico neste navegador.");
          }
        }
      } catch (e) {
        if (current === generation.current && !abort.signal.aborted) {
          const message =
            e instanceof Error
              ? e.message
              : "Falha de conexão. Tente novamente.";
          if (!receivedTechnical) setError(message);
          if (scope === "all" && !receivedCommercial)
            setCommercialError(message);
        }
      } finally {
        if (current === generation.current) {
          setBusy(false);
          if (scope === "all") setCommercialBusy(false);
        }
      }
    },
    [keep, history],
  );
  useEffect(() => {
    if (initialRun.current) return;
    initialRun.current = true;
    const params = new URL(window.location.href).searchParams;
    const q =
      params.get("auto") || initial || params.get("buy") || purchaseInitial.buy;
    if (q) {
      const query = { ...emptyInput, q };
      for (const key of [
        "brand",
        "model",
        "year",
        "engine",
        "code",
        "source",
      ] as const) {
        const legacy = {
          brand: "carBrand",
          model: "carModel",
          year: "carYear",
          engine: "carEngine",
          code: "partCode",
          source: "",
        }[key];
        const v =
          params.get("auto_" + key) ||
          (legacy ? params.get(legacy) || purchaseInitial[legacy] : null);
        if (v) (query as Record<string, string>)[key] = v;
      }
      void Promise.resolve().then(() =>
        run(
          query,
          Math.max(1, Math.min(5, Number(params.get("buyPage")) || 1)),
        ),
      );
    }
  }, [initial, run, purchaseInitial]);
  async function account(action: "list" | "save" | "clear") {
    setNotice("");
    try {
      const response = await fetch("/api/automotive-search/history", {
        method:
          action === "list" ? "GET" : action === "save" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        ...(action === "save"
          ? { body: JSON.stringify(data?.query || draft) }
          : {}),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Histórico indisponível.");
      if (action === "list") {
        setHistory(body.history.map((r: { query: SearchInput }) => r.query));
        setNotice(
          body.history.length
            ? "Pesquisas da sua conta."
            : "Nenhuma pesquisa salva na conta.",
        );
      } else {
        if (action === "clear") setHistory([]);
        setNotice(
          action === "save"
            ? "Pesquisa salva na sua conta."
            : "Histórico da conta removido.",
        );
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Histórico indisponível.");
    }
  }
  const sources = data?.sources || [],
    images: MediaResult[] = [
      ...(data?.images || []),
      ...sources
        .filter((s) => s.image && s.imagePage)
        .map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          image: s.image!,
          page: s.imagePage!,
          provider: s.provider,
        })),
    ].filter(
      (s, i, a) =>
        a.findIndex((v) => v.image === s.image && v.page === s.page) === i,
    );
  const shown = sources.filter(
    (s) =>
      tab === 1 ||
      (tab === 3 && s.kind === "video") ||
      (tab === 4 && s.kind === "diagnosis") ||
      (tab === 5 && s.kind === "diagram") ||
      (tab === 6 && s.kind === "code") ||
      (tab === 7 && s.kind === "manual"),
  );
  function sourceCard(source: SearchSource) {
    return (
      <article className="auto-source" key={source.id}>
        <span>
          {source.host} · {source.provider} ·{" "}
          {source.kind === "video" ? "vídeo no YouTube" : "resultado web"}
        </span>
        <h4>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title} ↗
          </a>
        </h4>
        {source.kind === "video" && (
          <>
            {source.image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="auto-video-thumb"
                  src={source.image}
                  alt={source.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </>
            )}
            {source.channel && <p>Canal: {source.channel}</p>}
            {source.embeddable &&
              /^Y[a-zA-Z0-9_-]{11}$/.test(source.id) &&
              (playing === source.id ? (
                <iframe
                  className="auto-video-player"
                  title={source.title}
                  src={`https://www.youtube-nocookie.com/embed/${source.id.slice(1)}?autoplay=1`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button type="button" onClick={() => setPlaying(source.id)}>
                  Reproduzir vídeo
                </button>
              ))}
          </>
        )}
        {source.kind === "manual" && (
          <p>
            Formato:{" "}
            {new URL(source.url).pathname.toLowerCase().endsWith(".pdf")
              ? "PDF"
              : "Página/documento na fonte"}
            . Aplicação e licença: conferir na publicação original.
          </p>
        )}
        {source.kind === "diagram" && (
          <p>
            Esquema da fonte original. Confirme veículo, ano, versão e
            conectores no documento.
          </p>
        )}
        <p>{source.snippet || "A fonte não forneceu trecho descritivo."}</p>
        <small>
          Consulta:{" "}
          {new Date(data!.queriedAt).toLocaleString("pt-BR", {
            timeZone: "America/Fortaleza",
          })}
          {source.published
            ? " · Publicação: " +
              new Date(source.published).toLocaleDateString("pt-BR", {
                timeZone: "America/Fortaleza",
              })
            : ""}
        </small>
      </article>
    );
  }
  return (
    <section
      className="automotive-search"
      aria-label="Buscador de peças e soluções automotivas"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(draft);
        }}
      >
        <label htmlFor={`${id}-q`}>O que você procura para seu veículo?</label>
        <div className="auto-searchbar">
          <input
            id={`${id}-q`}
            type="search"
            autoComplete="off"
            placeholder="Ex.: Alternador HB20 2026, sensor MAP, código P0106, alternador não carrega..."
            value={draft.q}
            maxLength={250}
            aria-controls={
              focused && suggestions.length > 0
                ? `${id}-suggestions`
                : undefined
            }
            onFocus={() => setFocused(true)}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") setFocused(false);
            }}
          />
          <button type="submit">Pesquisar</button>
        </div>
        {focused && suggestions.length > 0 && (
          <ul
            id={`${id}-suggestions`}
            className="auto-suggestions"
            aria-label="Sugestões de pesquisa"
          >
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => void run({ ...draft, q: s })}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className="auto-filters">
          <summary>Refinar veículo e fonte técnica</summary>
          <VehicleFilters value={draft} onChange={setDraft} />
        </details>
      </form>
      <button
        type="button"
        className="auto-clear"
        onClick={() => {
          controller.current?.abort();
          commercialController.current?.abort();
          ++generation.current;
          ++commercialGeneration.current;
          activeQuery.current = null;
          setDraft({ ...emptyInput });
          setData(null);
          setCommercial(null);
          setCommercialQuery(null);
          setError("");
          setCommercialError("");
          setBusy(false);
          setCommercialBusy(false);
          setFocused(false);
          setSuggestions([]);
          setPlaying(null);
          setTab(1);
          setImageFilter("all");
          const url = new URL(window.location.href);
          for (const key of [...url.searchParams.keys()])
            if (
              key === "auto" ||
              key.startsWith("auto_") ||
              [
                "buy",
                "carBrand",
                "carModel",
                "carYear",
                "carEngine",
                "partCode",
                "buyPage",
              ].includes(key)
            )
              url.searchParams.delete(key);
          window.history.replaceState(
            null,
            "",
            url.pathname + url.search + url.hash,
          );
          document.getElementById(`${id}-q`)?.focus();
        }}
      >
        Limpar pesquisa
      </button>
      <div className="auto-examples">
        {[
          "Sensor MAP HB20 2026",
          "Alternador não carrega",
          "P0106",
          "Bobina de ignição",
        ].map((q) => (
          <button
            type="button"
            key={q}
            onClick={() => void run({ ...draft, q })}
          >
            {q}
          </button>
        ))}
      </div>
      <details>
        <summary>Histórico de pesquisas</summary>
        <label className="auto-check">
          <input
            type="checkbox"
            checked={keep}
            onChange={(e) => {
              setKeep(e.target.checked);
              if (e.target.checked) {
                try {
                  const raw = JSON.parse(
                    localStorage.getItem("edson-auto-history") || "[]",
                  );
                  setHistory(
                    Array.isArray(raw)
                      ? raw
                          .map((q) => searchSchema.safeParse(q))
                          .filter((r) => r.success)
                          .map((r) => r.data!)
                          .slice(0, 12)
                      : [],
                  );
                } catch {
                  setNotice("Histórico local inválido; limpe para recomeçar.");
                }
              }
            }}
          />
          Guardar pesquisas neste navegador
        </label>
        <div className="auto-actions">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("edson-auto-history");
                setHistory([]);
                setNotice("Histórico local removido.");
              } catch {
                setNotice("O navegador bloqueou o acesso ao histórico local.");
              }
            }}
          >
            Limpar histórico local
          </button>
          <button type="button" onClick={() => void account("list")}>
            Histórico da minha conta
          </button>
          <button
            type="button"
            disabled={!data && !commercial}
            onClick={() => void account("save")}
          >
            Salvar pesquisa na conta
          </button>
          <button type="button" onClick={() => void account("clear")}>
            Limpar histórico da conta
          </button>
          <Link href="/login">Entrar na conta ↗</Link>
        </div>
        {history.length > 0 && (
          <ul>
            {history.map((q, i) => (
              <li key={i}>
                <button type="button" onClick={() => void run(q)}>
                  {q.q} {q.model} {q.year}
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
      {notice && <p role="status">{notice}</p>}
      {busy && (
        <div role="status" className="auto-status">
          Buscando informações técnicas, imagens e vídeos…
          <div className="auto-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="auto-status">
          <h3>Pesquisa técnica</h3>
          <p>{error}</p>
          <button
            type="button"
            onClick={() =>
              void run(
                activeQuery.current || draft,
                commercialQuery?.page || 1,
                "technical",
              )
            }
          >
            Tentar novamente
          </button>
        </div>
      )}
      {data && (
        <div ref={results} aria-live="polite">
          <div className="auto-result-meta">
            <strong>
              {
                {
                  ready: "Informações técnicas encontradas",
                  partial: "Pesquisa com informações parciais",
                  empty: "Nenhum resultado encontrado",
                  not_configured: "Pesquisa externa ainda não configurada",
                  unavailable: "Fontes temporariamente indisponíveis",
                }[data.status]
              }
            </strong>
            <p>
              Consulta:{" "}
              {new Date(data.queriedAt).toLocaleString("pt-BR", {
                timeZone: "America/Fortaleza",
              })}{" "}
              · {data.cached ? "Resultado em cache" : "Nova consulta"} ·{" "}
              {
                new Set(
                  sources
                    .filter((s) => s.kind !== "video")
                    .map((s) => s.host.replace(/^www\./, "")),
                ).size
              }{" "}
              domínio(s) web
            </p>
            {data.interpreted.corrected !== data.interpreted.original && (
              <p>
                Pesquisamos por <strong>{data.interpreted.corrected}</strong>.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...draft, q: data.interpreted.original });
                    setNotice(
                      "Termo original restaurado no campo; você pode editá-lo antes de pesquisar.",
                    );
                  }}
                >
                  Usar termo original no campo
                </button>
              </p>
            )}
            {data.interpreted.name && (
              <p>
                Termo reconhecido: {data.interpreted.name}.{" "}
                {data.interpreted.aliases.length > 0
                  ? "Também chamado: " + data.interpreted.aliases.join(", ")
                  : ""}
              </p>
            )}
            {data.status === "not_configured" && (
              <p>
                A consulta em tempo real depende de uma API de pesquisa
                habilitada no servidor. A biblioteca do portal continua
                disponível abaixo.
              </p>
            )}
            {["partial", "unavailable"].includes(data.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    activeQuery.current || data.query,
                    commercialQuery?.page || 1,
                    "technical",
                  )
                }
              >
                Atualizar informações técnicas
              </button>
            )}
            {data.providers.some((p) => p.state === "limited") && (
              <p>
                Uma das fontes atingiu seu limite de consultas. Os resultados
                disponíveis foram preservados.
              </p>
            )}
            {data.providers.some((p) => p.state === "unavailable") && (
              <p>Algumas fontes não responderam. Tente novamente mais tarde.</p>
            )}
          </div>
        </div>
      )}
      <nav
        hidden={
          !data &&
          !commercialQuery &&
          !busy &&
          !commercialBusy &&
          !error &&
          !commercialError
        }
        className="auto-tabs"
        role="tablist"
        aria-label="Tipos de resultado"
      >
        {tabs.map((t, i) => {
          const count =
            i === 0
              ? commercial?.offers.length
              : i === 1
                ? data
                  ? sources.length + (commercial?.offers.length || 0)
                  : undefined
                : i === 2
                  ? data
                    ? images.length
                    : undefined
                  : data
                    ? sources.filter(
                        (s) =>
                          s.kind ===
                          (
                            {
                              3: "video",
                              4: "diagnosis",
                              5: "diagram",
                              6: "code",
                              7: "manual",
                            } as Record<number, string>
                          )[i],
                      ).length
                    : undefined;
          return (
            <button
              key={t}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={tab === i}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => {
                tabTouched.current = true;
                setTab(i);
              }}
              onKeyDown={(e) => {
                const next =
                  e.key === "ArrowRight"
                    ? (i + 1) % 8
                    : e.key === "ArrowLeft"
                      ? (i + 7) % 8
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 7
                          : -1;
                if (next >= 0) {
                  e.preventDefault();
                  tabTouched.current = true;
                  setTab(next);
                  document.getElementById(`${id}-tab-${next}`)?.focus();
                }
              }}
            >
              {t}
              {count !== undefined && (
                <span className="auto-tab-count">{count}</span>
              )}
            </button>
          );
        })}
      </nav>
      {tabs.map(
        (_, i) =>
          i !== tab && (
            <div
              key={i}
              id={`${id}-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${i}`}
              hidden
            />
          ),
      )}
      <div
        role="tabpanel"
        id={`${id}-panel-${tab}`}
        aria-labelledby={`${id}-tab-${tab}`}
        hidden={
          !data &&
          !commercialQuery &&
          !busy &&
          !commercialBusy &&
          !error &&
          !commercialError
        }
        tabIndex={0}
      >
        {!data && tab > 1 && (
          <p>
            {busy
              ? "Consultando as fontes…"
              : "Pesquise para carregar esta categoria."}
          </p>
        )}
        {data && tab === 1 && (
          <>
            <section className="auto-answer">
              <h3>Resposta direta e informações técnicas</h3>
              {data.answer ? (
                <>
                  <p>{data.answer.summary}</p>
                  {data.answer.facts.map((fact, i) => (
                    <article key={i}>
                      <h4>
                        {categoryLabels[fact.category]} ·{" "}
                        {fact.status === "hypothesis"
                          ? "hipótese"
                          : fact.status === "unconfirmed"
                            ? "não confirmado"
                            : "informação geral"}
                      </h4>
                      <p>{fact.text}</p>
                      <div>
                        {fact.sourceIds.map((id) => {
                          const source = sources.find((s) => s.id === id);
                          return source ? (
                            <a
                              key={id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              [{source.title}] ↗{" "}
                            </a>
                          ) : null;
                        })}
                      </div>
                    </article>
                  ))}
                  <ul>
                    {data.answer.missing.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                  <p>
                    Síntese por IA dos títulos e trechos devolvidos pela
                    pesquisa. As citações permitem conferir as páginas; não
                    representam validação independente de códigos, aplicação ou
                    procedimentos.
                  </p>
                </>
              ) : (
                <p>
                  {data.ai === "not_configured"
                    ? "A síntese por IA não está habilitada. Consulte os trechos e links das fontes encontradas."
                    : data.ai === "no_evidence"
                      ? "Não há evidência externa suficiente para gerar uma síntese."
                      : "Não foi possível gerar a síntese agora. Os resultados originais continuam disponíveis."}
                </p>
              )}
              <p>
                Aplicação, localização específica, código OEM e equivalências:
                confirme ano, versão, motor, código e documentação do
                fabricante. Mencionar um veículo na pesquisa não comprova
                compatibilidade.
              </p>
            </section>
          </>
        )}
        <div
          id="ofertas-de-pecas"
          hidden={
            (!data &&
              !commercialQuery &&
              !busy &&
              !commercialBusy &&
              !error &&
              !commercialError) ||
            (tab !== 0 && tab !== 1)
          }
        >
          {(data?.interpreted.intent === "symptom" ||
            data?.interpreted.intent === "code") && (
            <p className="auto-status">
              Ofertas para pesquisa. O sintoma ou código não confirma defeito
              nem necessidade de substituir a peça.
            </p>
          )}
          <PartsMarketplace
            embedded
            key={JSON.stringify([
              commercialQuery?.q,
              commercialQuery?.brand,
              commercialQuery?.model,
              commercialQuery?.year,
              commercialQuery?.engine,
              commercialQuery?.code,
            ])}
            initial={
              commercialQuery
                ? {
                    ...purchaseInitial,
                    buy: commercialQuery.q,
                    carBrand: commercialQuery.brand,
                    carModel: commercialQuery.model,
                    carYear: commercialQuery.year,
                    carEngine: commercialQuery.engine,
                    partCode: commercialQuery.code,
                  }
                : {}
            }
            controlled={{
              query: commercialQuery,
              result: commercial,
              busy: commercialBusy,
              error: commercialError,
              onSearch: purchaseSearch,
              onClear: () => {
                commercialController.current?.abort();
                ++commercialGeneration.current;
                setCommercial(null);
                setCommercialQuery(null);
                setCommercialBusy(false);
                setCommercialError("");
              },
            }}
          />
        </div>
        {data && (
          <div aria-live="polite">
            {(tab === 4 || tab === 6) && (
              <DiagnosticEvidence data={data} codes={tab === 6} />
            )}
            {tab === 2 ? (
              <>
                <label className="auto-image-filter">
                  Tipo de imagem
                  <select
                    value={imageFilter}
                    onChange={(e) => setImageFilter(e.target.value)}
                  >
                    {Object.entries({
                      all: "Todas",
                      photo: "Fotografias identificadas pela fonte",
                      diagram: "Diagramas",
                      exploded: "Vistas explodidas",
                      connector: "Conectores",
                      location: "Localização",
                      other: "Outras / tipo não informado",
                    }).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                {(imageFilter === "all"
                  ? images
                  : images.filter(
                      (i) => imageKind(i.title, i.page) === imageFilter,
                    )
                ).length ? (
                  <div className="auto-image-grid">
                    {(imageFilter === "all"
                      ? images
                      : images.filter(
                          (i) => imageKind(i.title, i.page) === imageFilter,
                        )
                    ).map((i) => (
                      <Picture
                        key={i.id}
                        image={i.image}
                        title={i.title}
                        page={i.page}
                      />
                    ))}
                  </div>
                ) : (
                  <p>
                    Nenhuma imagem foi fornecida pelas fontes nesta consulta.
                  </p>
                )}
              </>
            ) : tab !== 0 ? (
              <section className="auto-sources">
                <h3>{tab === 1 ? "Fontes encontradas" : tabs[tab]}</h3>
                {shown.length ? (
                  shown.map(sourceCard)
                ) : (
                  <p>
                    Nenhum resultado desta categoria foi retornado. Refine o
                    termo ou consulte outra fonte.
                  </p>
                )}
              </section>
            ) : null}
            {tab === 1 && images.length > 0 && (
              <>
                <h3>Imagens relacionadas</h3>
                <div className="auto-image-grid">
                  {images.slice(0, 4).map((i) => (
                    <Picture
                      key={i.id}
                      image={i.image}
                      title={i.title}
                      page={i.page}
                    />
                  ))}
                </div>
              </>
            )}
            {(data.answer?.related.length ||
              data.interpreted.suggestions.length) > 0 && (
              <section>
                <h3>Pesquisas relacionadas</h3>
                <div className="auto-examples">
                  {[
                    ...new Set([
                      ...(data.answer?.related || []),
                      ...data.interpreted.suggestions,
                    ]),
                  ]
                    .slice(0, 8)
                    .map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => void run({ ...draft, q })}
                      >
                        {q}
                      </button>
                    ))}
                </div>
              </section>
            )}
            <details>
              <summary>Fontes e condições da consulta</summary>
              <ul>
                {data.providers.map((p) => (
                  <li key={p.id}>
                    {p.id}:{" "}
                    {
                      {
                        ok: "consultada",
                        limited: "limite atingido",
                        unavailable: "indisponível",
                        not_configured: "não configurada",
                      }[p.state]
                    }
                  </li>
                ))}
              </ul>
              <p>
                Resultados são títulos, trechos e mídias indicados pelas APIs.
                Não há leitura integral de todos os documentos nem garantia de
                cobertura de toda a internet. Trechos conflitantes devem ser
                conferidos nas fontes.
              </p>
            </details>
          </div>
        )}
      </div>
      {!data && !busy && !error && (
        <p className="auto-empty">
          Comece com uma peça, um sintoma ou um código. Para aplicação
          específica, acrescente ano, motor e versão.
        </p>
      )}
    </section>
  );
}
