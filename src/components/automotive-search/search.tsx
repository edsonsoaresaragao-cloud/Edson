"use client";
import Link from "next/link";
import { PartsMarketplace } from "@/components/parts-marketplace";
import { VehicleFilters } from "./vehicle-filters";
import type { PartsQuery, PartsResult } from "@/lib/parts/catalog";
import type { UnifiedResult } from "@/lib/automotive-search/unified";
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
      <dialog ref={dialog} className="auto-image-dialog">
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
    [suggestions, setSuggestions] = useState<string[]>([]),
    [focused, setFocused] = useState(false),
    [keep, setKeep] = useState(false),
    [history, setHistory] = useState<SearchInput[]>([]),
    [notice, setNotice] = useState("");
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
      const response = await fetch(
        "/api/parts-search?" +
          new URLSearchParams(
            Object.entries(query).map(([k, v]) => [k, String(v)]),
          ),
        { signal: abort.signal, cache: "no-store" },
      );
      const body = await response.json();
      if (current !== commercialGeneration.current || abort.signal.aborted)
        return;
      if (!Array.isArray(body.offers))
        throw new Error(body.message || "Não foi possível consultar ofertas.");
      setCommercial(body);
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
    async (input: SearchInput, offerPage = 1) => {
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
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      const current = ++generation.current;
      setDraft(query);
      setBusy(true);
      setData(null);
      setError("");
      tabTouched.current = false;
      setTab(1);
      setPlaying(null);
      commercialController.current?.abort();
      ++commercialGeneration.current;
      setCommercial(null);
      setCommercialQuery(null);
      setCommercialBusy(true);
      setCommercialError("");
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
      try {
        const response = await fetch(
          "/api/automotive-search/unified?" +
            new URLSearchParams({ ...query, offerPage: String(offerPage) }),
          { signal: abort.signal, cache: "no-store" },
        );
        const body = await response.json();
        if (current !== generation.current) return;
        if (!body.version)
          throw new Error(body.error || "Não foi possível pesquisar agora.");
        const result = body as UnifiedResult;
        setData(result.technical);
        setError(result.errors.technical || "");
        setCommercial(result.commercial);
        setCommercialQuery(result.commercialQuery);
        setCommercialError(result.errors.commercial || "");
        setCommercialBusy(false);
        if (!tabTouched.current)
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
            }[result.intent] ?? 1,
          );
        purchaseUrl(result.commercialQuery);
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
        if (current === generation.current && !abort.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Falha de conexão. Tente novamente.",
          );
      } finally {
        if (current === generation.current) {
          setBusy(false);
          setCommercialBusy(false);
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
    <section className="automotive-search" aria-labelledby={`${id}-title`}>
      <header>
        <span className="eyebrow">PESQUISA TÉCNICA / EDSON OFICINA</span>
        <h2 id={`${id}-title`}>
          O que você quer busca de peças ou entender no seu veículo?
        </h2>
        <p>
          Pesquise peças, sintomas e códigos. Reúna explicações, imagens, vídeos
          e fontes para continuar a investigação.
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(draft);
        }}
      >
        <label htmlFor={`${id}-q`}>Peça, sintoma ou pergunta automotiva</label>
        <div className="auto-searchbar">
          <input
            id={`${id}-q`}
            type="search"
            autoComplete="off"
            placeholder="Ex.: sensor MAP HB20 2026, bateria descarregando, P0106…"
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
          <button type="submit" disabled={busy}>
            {busy ? "Pesquisando…" : "Pesquisar"}
          </button>
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
        <p role="status" className="auto-status">
          Consultando fontes externas e reunindo referências…
        </p>
      )}
      {error && (
        <div role="alert" className="auto-status">
          <p>{error}</p>
          <button type="button" onClick={() => void run(draft)}>
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
                  ready: "Pesquisa concluída",
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
      <nav className="auto-tabs" role="tablist" aria-label="Tipos de resultado">
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
        tabIndex={0}
      >
        {!data && tab > 1 && (
          <p>
            {busy
              ? "Consultando as fontes…"
              : "Pesquise para carregar esta categoria."}
          </p>
        )}
        <div id="ofertas-de-pecas" hidden={tab !== 0 && tab !== 1}>
          {(data?.interpreted.intent === "symptom" ||
            data?.interpreted.intent === "code") && (
            <p className="auto-status">
              Ofertas para pesquisa. O sintoma ou código não confirma defeito
              nem necessidade de substituir a peça.
            </p>
          )}
          <PartsMarketplace
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
            {[1, 4, 6].includes(tab) && (
              <>
                <section className="auto-answer">
                  {tab === 4 && (
                    <p>
                      Não substitua componentes com base apenas no sintoma.
                      Ferramentas, valores e critérios específicos dependem da
                      documentação da versão do veículo.
                    </p>
                  )}
                  {tab === 6 && (
                    <p>
                      {(data.query.q.match(/\b[PCBU][0-9A-F]{4}\b/gi) || [])
                        .map(
                          (code) =>
                            `${code.toUpperCase()}: ${/^[Pp][02]/.test(code) ? "estrutura padronizada de propulsão" : /^[Pp]1/.test(code) ? "faixa específica de fabricante" : "consultar norma e definição da montadora"}`,
                        )
                        .join(" · ")}
                      . A descrição, causas e testes devem ser conferidos nas
                      fontes; o código não confirma uma peça defeituosa.
                    </p>
                  )}
                  <h3>
                    {tab === 4
                      ? "Diagnóstico e verificações nas fontes"
                      : tab === 6
                        ? "Código de falha e referências"
                        : "Resposta direta e informações técnicas"}
                  </h3>
                  {data.answer ? (
                    <>
                      <p>{data.answer.summary}</p>
                      {data.answer.facts
                        .filter((f) =>
                          tab === 4
                            ? [
                                "function",
                                "symptoms",
                                "tools",
                                "tests",
                                "decision",
                                "diagnosis",
                                "repair",
                                "safety",
                                "divergence",
                              ].includes(f.category)
                            : tab === 6
                              ? [
                                  "codes",
                                  "diagnosis",
                                  "tests",
                                  "safety",
                                  "divergence",
                                ].includes(f.category)
                              : true,
                        )
                        .map((fact, i) => (
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
                        representam validação independente de códigos, aplicação
                        ou procedimentos.
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
                    Aplicação, localização específica, código OEM e
                    equivalências: confirme ano, versão, motor, código e
                    documentação do fabricante. Mencionar um veículo na pesquisa
                    não comprova compatibilidade.
                  </p>
                </section>
                {tab === 1 && data.localReferences?.length > 0 && (
                  <section className="auto-local">
                    <h3>Biblioteca técnica do portal</h3>
                    <p>
                      Conteúdo educativo local, separado dos resultados
                      consultados na internet.
                    </p>
                    {data.localReferences.map((item, i) => (
                      <article key={i}>
                        <h4>{item.name}</h4>
                        <p>{item.function}</p>
                        <p>{item.notes}</p>
                        <Link href={item.href}>
                          Explorar referência no portal ↗
                        </Link>
                      </article>
                    ))}
                  </section>
                )}
              </>
            )}
            {tab === 2 ? (
              images.length ? (
                <div className="auto-image-grid">
                  {images.map((i) => (
                    <Picture
                      key={i.id}
                      image={i.image}
                      title={i.title}
                      page={i.page}
                    />
                  ))}
                </div>
              ) : (
                <p>Nenhuma imagem foi fornecida pelas fontes nesta consulta.</p>
              )
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
      <footer>
        <Link href="/pecas#ofertas-de-pecas">Comparar ofertas de peças ↗</Link>
        <Link href="/categorias">Conhecimento por sistema ↗</Link>
      </footer>
    </section>
  );
}
