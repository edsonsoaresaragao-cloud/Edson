"use client";
import Link from "next/link";
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
  return (
    <figure className="auto-picture">
      {failed ? (
        <p>Imagem indisponível na fonte.</p>
      ) : (
        <a href={page} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        </a>
      )}
      <figcaption>
        <a href={page} target="_blank" rel="noopener noreferrer">
          {title} · fonte original ↗
        </a>
      </figcaption>
    </figure>
  );
}
export function AutomotiveSearch({ initial = "" }: { initial?: string } = {}) {
  const id = useId(),
    [draft, setDraft] = useState<SearchInput>({ ...emptyInput, q: initial }),
    [data, setData] = useState<SearchResponse | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState(0),
    [suggestions, setSuggestions] = useState<string[]>([]),
    [focused, setFocused] = useState(false),
    [keep, setKeep] = useState(false),
    [history, setHistory] = useState<SearchInput[]>([]),
    [notice, setNotice] = useState("");
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
  useEffect(() => () => controller.current?.abort(), []);
  const run = useCallback(
    async (input: SearchInput) => {
      const parsed = searchSchema.safeParse(input);
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
      setTab(0);
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
          "/api/automotive-search?" + new URLSearchParams(query),
          { signal: abort.signal, cache: "no-store" },
        );
        const body = await response.json();
        if (current !== generation.current) return;
        if (!body.version)
          throw new Error(body.error || "Não foi possível pesquisar agora.");
        setData(body);
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
        if (current === generation.current) setBusy(false);
      }
    },
    [keep, history],
  );
  useEffect(() => {
    if (initialRun.current) return;
    initialRun.current = true;
    const params = new URL(window.location.href).searchParams;
    const q = params.get("auto") || initial;
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
        const v = params.get("auto_" + key);
        if (v) (query as Record<string, string>)[key] = v;
      }
      void Promise.resolve().then(() => run(query));
    }
  }, [initial, run]);
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
      tab === 0 ||
      (tab === 2 && s.kind === "video") ||
      (tab === 3 && s.kind === "diagnosis") ||
      (tab === 4 && s.kind === "diagram") ||
      (tab === 5 && s.kind === "code") ||
      (tab === 6 && s.kind === "manual"),
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
        <h2 id={`${id}-title`}>O que você quer entender no seu veículo?</h2>
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
          <div className="auto-grid">
            {(["brand", "model", "year", "engine", "code"] as const).map(
              (key) => (
                <label key={key}>
                  {
                    {
                      brand: "Montadora",
                      model: "Modelo",
                      year: "Ano",
                      engine: "Motor / versão",
                      code: "Código da peça informado",
                    }[key]
                  }
                  <input
                    value={draft[key]}
                    maxLength={80}
                    inputMode={key === "year" ? "numeric" : "text"}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                </label>
              ),
            )}
            <label>
              Fonte técnica (web)
              <select
                value={draft.source}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    source: e.target.value as SearchInput["source"],
                  })
                }
              >
                <option value="all">Todas as fontes</option>
                {[
                  "bosch",
                  "ngk",
                  "delphi",
                  "denso",
                  "continental",
                  "mahle",
                  "gates",
                  "oficina",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s === "oficina" ? "Oficina Brasil" : s.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
            disabled={!data}
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
          <nav className="auto-tabs" aria-label="Tipos de resultado">
            {tabs.map((t, i) => (
              <button
                key={t}
                type="button"
                aria-current={tab === i ? "page" : undefined}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === 0 && (
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
                  Aplicação, localização específica, código OEM e equivalências:
                  confirme ano, versão, motor, código e documentação do
                  fabricante. Mencionar um veículo na pesquisa não comprova
                  compatibilidade.
                </p>
              </section>
              {data.localReferences?.length > 0 && (
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
          {tab === 1 ? (
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
          ) : (
            <section className="auto-sources">
              <h3>{tab === 0 ? "Fontes encontradas" : tabs[tab]}</h3>
              {shown.length ? (
                shown.map(sourceCard)
              ) : (
                <p>
                  Nenhum resultado desta categoria foi retornado. Refine o termo
                  ou consulte outra fonte.
                </p>
              )}
            </section>
          )}
          {tab === 0 && images.length > 0 && (
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
              Resultados são títulos, trechos e mídias indicados pelas APIs. Não
              há leitura integral de todos os documentos nem garantia de
              cobertura de toda a internet. Trechos conflitantes devem ser
              conferidos nas fontes.
            </p>
          </details>
        </div>
      )}
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
