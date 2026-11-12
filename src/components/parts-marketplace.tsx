"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { lowestComparable } from "@/lib/parts/details";
import { ComponentReferenceImage } from "./component-reference-image";
import { matchingPartReferences } from "@/lib/parts/references";
import {
  Search,
  ArrowUpRight,
  PackageSearch,
  ImageOff,
  SlidersHorizontal,
} from "lucide-react";
import {
  partsQuerySchema,
  buildPartsQuery,
  externalPartsSearches,
  correctPartName,
  type PartsQuery,
  type PartsResult,
  type Offer,
} from "@/lib/parts/catalog";
type Draft = {
  q: string;
  brand: string;
  model: string;
  year: string;
  engine: string;
  code: string;
};
function initialDraft(initial: Record<string, string | undefined>): Draft {
  return {
    q: initial.buy || "",
    brand: initial.carBrand || "",
    model: initial.carModel || "",
    year: initial.carYear || "",
    engine: initial.carEngine || "",
    code: initial.partCode || "",
  };
}
function OfferPicture({ offer }: { offer: Offer }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="parts-offer-picture">
      {offer.image && !failed ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.image}
            alt={offer.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <span>
          <ImageOff size={30} />
          Foto indisponível na fonte
        </span>
      )}
    </div>
  );
}
export function PartsMarketplace({
  initial = {},
  controlled,
}: {
  initial?: Record<string, string | undefined>;
  controlled?: {
    query: PartsQuery | null;
    result: PartsResult | null;
    busy: boolean;
    error: string;
    onSearch: (query: PartsQuery) => void;
    onClear: () => void;
  };
}) {
  const seed = initialDraft(initial),
    parsed = partsQuerySchema.safeParse({
      ...seed,
      page: initial.buyPage || 1,
    });
  const [draft, setDraft] = useState<Draft>(() => seed),
    [localActive, setActive] = useState<PartsQuery | null>(() =>
      parsed.success ? parsed.data : null,
    ),
    [localData, setData] = useState<PartsResult | null>(null),
    [localBusy, setBusy] = useState(() => parsed.success),
    [localError, setError] = useState(""),
    [sort, setSort] = useState("relevance"),
    [store, setStore] = useState("all"),
    [onlyPhoto, setOnlyPhoto] = useState(false),
    [partBrand, setPartBrand] = useState("all"),
    [condition, setCondition] = useState("all"),
    [confirmedOnly, setConfirmedOnly] = useState(false),
    [minPrice, setMinPrice] = useState(""),
    [maxPrice, setMaxPrice] = useState("");
  const active = controlled ? controlled.query : localActive,
    data = controlled ? controlled.result : localData,
    busy = controlled ? controlled.busy : localBusy,
    error = localError || (controlled ? controlled.error : "");
  const results = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  function run(input: Draft | PartsQuery, page = 1) {
    const next = partsQuerySchema.safeParse({ ...input, page });
    generation.current++;
    if (!next.success) {
      setActive(null);
      setData(null);
      setBusy(false);
      setError(
        next.error.issues[0]?.message || "Confira os campos da pesquisa.",
      );
      return;
    }
    setError("");
    if (controlled) {
      setDraft(next.data);
      controlled.onSearch(next.data);
      return;
    }
    setData(null);
    setStore("all");
    setBusy(true);
    setActive(next.data);
    const url = new URL(window.location.href);
    const fields: Record<string, string> = {
      buy: next.data.q,
      carBrand: next.data.brand,
      carModel: next.data.model,
      carYear: next.data.year,
      carEngine: next.data.engine,
      partCode: next.data.code,
      buyPage: String(page),
    };
    for (const [k, v] of Object.entries(fields)) {
      if (v && !(k === "buyPage" && v === "1")) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  function clearSearch() {
    controlled?.onClear();
    setPartBrand("all");
    setCondition("all");
    setConfirmedOnly(false);
    setMinPrice("");
    setMaxPrice("");
    generation.current++;
    setDraft(initialDraft({}));
    setActive(null);
    setData(null);
    setBusy(false);
    setError("");
    setStore("all");
    setSort("relevance");
    setOnlyPhoto(false);
    const url = new URL(window.location.href);
    for (const key of [
      "buy",
      "carBrand",
      "carModel",
      "carYear",
      "carEngine",
      "partCode",
      "buyPage",
    ])
      url.searchParams.delete(key);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    document.getElementById("parts-purchase-query")?.focus();
  }
  useEffect(() => {
    if (!active || controlled) return;
    const controller = new AbortController(),
      id = generation.current;
    const params = new URLSearchParams(
      Object.entries(active).map(([k, v]) => [k, String(v)]),
    );
    fetch("/api/parts-search?" + params, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (controller.signal.aborted || id !== generation.current) return;
        if (body && Array.isArray(body.offers) && Array.isArray(body.sources)) {
          setData(body as PartsResult);
          setError("");
        } else
          setError(
            typeof body?.message === "string"
              ? body.message
              : "Não foi possível consultar as ofertas agora.",
          );
      })
      .catch(() => {
        if (!controller.signal.aborted && id === generation.current)
          setError(
            "A consulta não respondeu. Tente novamente ou continue a pesquisa nas lojas.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted && id === generation.current)
          setBusy(false);
      });
    return () => controller.abort();
  }, [active, controlled]);
  const searchText = active
    ? buildPartsQuery(active)
    : [draft.q, draft.code, draft.brand, draft.model, draft.year, draft.engine]
        .filter(Boolean)
        .join(" ");
  const references = active ? matchingPartReferences(active) : [];
  const stores = Array.from(
    new Set(data?.offers.map((o) => o.store) || []),
  ).sort();
  const partBrands = [
    ...new Set(
      data?.offers
        .map((o) => o.details?.brand)
        .filter((v): v is string => !!v) || [],
    ),
  ].sort();
  const cheapest = lowestComparable(data?.offers || []);
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);
  const visible = (data?.offers || [])
    .filter(
      (o) =>
        (store === "all" || o.store === store) &&
        (!onlyPhoto || !!o.image) &&
        (partBrand === "all" || o.details?.brand === partBrand) &&
        (condition === "all" || o.details?.condition === condition) &&
        (!confirmedOnly || o.details?.compatibility === "confirmed") &&
        (!minPrice ||
          (o.price !== null &&
            o.price >= Number(minPrice.replace(",", ".")))) &&
        (!maxPrice ||
          (o.price !== null && o.price <= Number(maxPrice.replace(",", ".")))),
    )
    .slice()
    .sort((a, b) =>
      sort === "brand"
        ? (a.details?.brand || "\uffff").localeCompare(
            b.details?.brand || "\uffff",
            "pt-BR",
          )
        : sort === "total"
          ? (a.details?.total ?? Infinity) - (b.details?.total ?? Infinity)
          : sort === "relevance"
            ? 0
            : a.price === null
              ? b.price === null
                ? 0
                : 1
              : b.price === null
                ? -1
                : sort === "low"
                  ? a.price - b.price
                  : b.price - a.price,
    );
  function field(name: keyof Draft) {
    return {
      value: draft[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setDraft((d) => ({ ...d, [name]: e.target.value })),
    };
  }
  return (
    <section
      className="parts-marketplace"
      aria-labelledby="parts-marketplace-title"
    >
      <div className="parts-search-intro">
        <span className="eyebrow">PESQUISE OFERTAS / COMPARE LOJAS</span>
        <h2 id="parts-marketplace-title">
          Busque pelo nome, código e veículo.
        </h2>
        <p>
          Veja fotos e informações das fontes consultadas e abra o anúncio para
          comprar na loja.
        </p>
      </div>
      <form
        action="/pecas"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          run(draft);
        }}
        className="parts-purchase-form"
      >
        <div className="parts-main-query">
          <label htmlFor="parts-purchase-query">
            Peça ou código para pesquisar
          </label>
          <div>
            <Search size={20} aria-hidden="true" />
            <input
              id="parts-purchase-query"
              name="buy"
              minLength={2}
              maxLength={250}
              placeholder="Ex.: bobina de ignição, pastilha de freio…"
              {...field("q")}
            />
            <button type="submit" className="button">
              Buscar ofertas <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="parts-vehicle-fields">
          <label>
            Marca do veículo
            <input
              name="carBrand"
              placeholder="Ex.: Chevrolet"
              maxLength={60}
              {...field("brand")}
            />
          </label>
          <label>
            Modelo
            <input
              name="carModel"
              placeholder="Ex.: Onix"
              maxLength={150}
              {...field("model")}
            />
          </label>
          <label>
            Ano
            <input
              name="carYear"
              type="number"
              min="1900"
              max="2100"
              placeholder="Ex.: 2020"
              {...field("year")}
            />
          </label>
          <label>
            Motor / versão
            <input
              name="carEngine"
              placeholder="Ex.: 1.0 turbo"
              maxLength={160}
              {...field("engine")}
            />
          </label>
          <label>
            Código da peça / OEM
            <input
              name="partCode"
              placeholder="Se souber, informe o código"
              maxLength={60}
              {...field("code")}
            />
          </label>
        </div>
        <p className="parts-fitment-note">
          Os campos refinam os termos de busca. Confirme código, motor, ano e
          aplicação no anúncio ou com o vendedor.
        </p>
      </form>
      <button type="button" className="parts-clear" onClick={clearSearch}>
        Limpar busca de ofertas
      </button>
      <div className="parts-examples" aria-label="Sugestões de busca">
        {[
          "Pastilha de freio",
          "Bobina de ignição",
          "Amortecedor",
          "Sensor MAP",
        ].map((q) => (
          <button
            type="button"
            key={q}
            onClick={() => {
              setDraft((d) => ({ ...d, q }));
              run({ ...draft, q });
            }}
          >
            {q}
          </button>
        ))}
      </div>
      <div ref={results} className="parts-offers-area" aria-busy={busy}>
        {active && correctPartName(active.q) !== active.q && (
          <p className="parts-fitment-note">
            Pesquisando por “{correctPartName(active.q)}” com os dados do
            veículo informado.
          </p>
        )}
        {references.length > 0 && (busy || !data?.offers.length) && (
          <div className="parts-reference-area">
            <h3>Referência da peça pesquisada</h3>
            <p>
              Identificação técnica para ajudar na pesquisa. Esta ficha não é um
              anúncio e não confirma aplicação no veículo informado.
            </p>
            {references.map((item) => (
              <article className="parts-reference-card" key={item.id}>
                <ComponentReferenceImage item={item} />
                <div>
                  <span className="parts-reference-label">
                    CATÁLOGO TÉCNICO · {item.system}
                  </span>
                  <h4>{item.name}</h4>
                  <p>{item.function}</p>
                  <p>
                    <strong>Inspeção básica:</strong> {item.inspection}
                  </p>
                  <p className="parts-fitment-note">
                    Confirme código, ano, motor e conectores com o vendedor.
                    Preço e estoque não foram consultados nesta ficha.
                  </p>
                  <div className="parts-reference-links">
                    <a
                      href={externalPartsSearches(searchText)[0].url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Buscar esta peça no Mercado Livre ↗
                    </a>
                    <Link
                      href="/categorias/sensores-e-atuadores"
                      prefetch={false}
                    >
                      Ver catálogo técnico →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {busy && (
          <div className="parts-search-status" role="status">
            <Search size={24} />
            <h3>Consultando as fontes de ofertas…</h3>
            <p>Os anúncios serão exibidos quando a consulta terminar.</p>
          </div>
        )}
        {error && (
          <div className="parts-search-status" role="alert">
            <h3>Não foi possível concluir a busca.</h3>
            <p>{error}</p>
            {active && (
              <button
                type="button"
                className="button secondary"
                onClick={() => run(active, active.page)}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
        {data && !busy && (
          <>
            <div className="parts-results-header">
              <div>
                <h3>
                  {data.status === "not_configured"
                    ? "Continue a pesquisa nas lojas abaixo"
                    : data.status === "unavailable"
                      ? "As fontes estão indisponíveis no momento"
                      : `${data.offers.length} ofertas nesta página`}
                </h3>
                <p>
                  {data.status === "not_configured"
                    ? "Não recebemos anúncios nesta consulta. A referência técnica e os links de pesquisa continuam disponíveis."
                    : data.status === "unavailable"
                      ? "Você pode tentar novamente ou abrir a mesma pesquisa nos sites abaixo."
                      : `Pesquisa: ${data.query}`}
                </p>
              </div>
              {data.status !== "not_configured" &&
                data.status !== "unavailable" && (
                  <span>
                    Consulta{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Fortaleza",
                    }).format(new Date(data.queriedAt))}
                    {data.cached ? " · em cache" : ""}
                  </span>
                )}
            </div>
            {data.sources.length > 0 && (
              <div
                className="parts-source-list"
                aria-label="Fontes consultadas"
              >
                {data.sources.map((s) => (
                  <span key={s.id} data-state={s.state}>
                    {s.label} ·{" "}
                    {s.state === "ok"
                      ? "consultada"
                      : s.state === "limited"
                        ? "limite de consulta atingido"
                        : "indisponível"}
                  </span>
                ))}
              </div>
            )}
            {data.status === "partial" && (
              <p className="parts-fitment-note">
                Exibindo as fontes que responderam; parte da consulta está
                indisponível.
              </p>
            )}
            {data.publicSearch && data.offers.length > 0 && (
              <p className="parts-fitment-note">
                Produtos encontrados em páginas públicas. Fotos e preços
                aparecem quando informados pelas fontes; confirme os dados na
                loja.
              </p>
            )}
            {data.offers.length > 0 && (
              <>
                <div className="parts-local-filters">
                  <SlidersHorizontal size={18} aria-hidden="true" />
                  <label>
                    Loja nesta página
                    <select
                      value={store}
                      onChange={(e) => setStore(e.target.value)}
                    >
                      <option value="all">Todas as lojas</option>
                      {stores.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ordenar
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="relevance">
                        Relevância / código informado
                      </option>
                      <option value="low">Menor preço em R$</option>
                      <option value="high">Maior preço em R$</option>
                      <option value="brand">Marca da peça</option>
                      <option value="total">
                        Preço total com frete conhecido
                      </option>
                    </select>
                  </label>
                  <label>
                    Marca da peça
                    <select
                      value={partBrand}
                      onChange={(e) => setPartBrand(e.target.value)}
                    >
                      <option value="all">Todas as marcas</option>
                      {partBrands.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Condição
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="all">Todas as condições</option>
                      <option value="new">Novo</option>
                      <option value="used">Usado</option>
                      <option value="refurbished">Recondicionado</option>
                      <option value="unknown">Não informada</option>
                    </select>
                  </label>
                  <label>
                    Preço mínimo (R$)
                    <input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </label>
                  <label>
                    Preço máximo (R$)
                    <input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </label>
                  <label className="parts-photo-filter">
                    <input
                      type="checkbox"
                      checked={confirmedOnly}
                      onChange={(e) => setConfirmedOnly(e.target.checked)}
                    />
                    Somente compatibilidade confirmada
                  </label>
                  <label className="parts-photo-filter">
                    <input
                      type="checkbox"
                      checked={onlyPhoto}
                      onChange={(e) => setOnlyPhoto(e.target.checked)}
                    />
                    Com foto na fonte
                  </label>
                </div>
                <p className="parts-fitment-note" aria-live="polite">
                  {visible.length} ofertas exibidas. Preços sem valor numérico
                  em R$ ficam no fim da ordenação.
                </p>
                <div className="parts-offer-grid">
                  {visible.map((o) => (
                    <article className="parts-offer" key={o.id}>
                      <OfferPicture offer={o} />
                      <div className="parts-offer-copy">
                        <span className="parts-store">{o.store}</span>
                        <h3>{o.title}</h3>
                        {cheapest.has(o.id) && (
                          <span className="parts-comparable">
                            Menor preço da mesma referência e condição nesta
                            página · sem frete
                          </span>
                        )}
                        <dl className="parts-offer-details">
                          <div>
                            <dt>Marca</dt>
                            <dd>{o.details?.brand || "Não informada"}</dd>
                          </div>
                          <div>
                            <dt>Código do anúncio</dt>
                            <dd>{o.details?.code || "Não informado"}</dd>
                          </div>
                          <div>
                            <dt>Condição</dt>
                            <dd>
                              {
                                {
                                  new: "Novo",
                                  used: "Usado",
                                  refurbished: "Recondicionado",
                                  unknown: "Não informada",
                                }[o.details?.condition || "unknown"]
                              }
                            </dd>
                          </div>
                          <div>
                            <dt>Estoque</dt>
                            <dd>
                              {
                                {
                                  in_stock: "Disponível segundo a fonte",
                                  out_of_stock: "Indisponível segundo a fonte",
                                  preorder: "Pré-venda segundo a fonte",
                                  unknown: "Não informado",
                                }[o.details?.availability || "unknown"]
                              }
                            </dd>
                          </div>
                          <div>
                            <dt>Aplicação</dt>
                            <dd>
                              {o.details?.applications.join(" · ") ||
                                "Não informada pelo vendedor"}
                            </dd>
                          </div>
                          <div>
                            <dt>Compatibilidade</dt>
                            <dd>
                              {o.details?.compatibility === "confirmed"
                                ? "Confirmada por integração de aplicação"
                                : o.details?.compatibility === "declared"
                                  ? "Declarada pelo vendedor; não verificada"
                                  : "Não verificada"}
                            </dd>
                          </div>
                        </dl>
                        <p className="parts-description">
                          {o.description ||
                            "Descrição completa disponível no anúncio de origem."}
                        </p>
                        {o.codeMatch && (
                          <span className="parts-code-match">
                            Código informado aparece no anúncio
                          </span>
                        )}
                        <strong className="parts-price">
                          {o.priceText || "Preço no anúncio"}
                        </strong>
                        {o.details?.priceUpdatedAt && (
                          <p>
                            Preço datado pela fonte:{" "}
                            {new Date(o.details.priceUpdatedAt).toLocaleString(
                              "pt-BR",
                              { timeZone: "America/Fortaleza" },
                            )}
                            . Confirme o valor atual no anúncio.
                          </p>
                        )}
                        <p>
                          Frete:{" "}
                          {o.details?.shipping != null
                            ? money(o.details.shipping)
                            : "Consultar na loja"}{" "}
                          · Total:{" "}
                          {o.details?.total != null
                            ? money(o.details.total)
                            : "Depende do frete"}
                        </p>
                        <small>
                          Consultado em{" "}
                          {new Date(
                            o.checkedAt || data.queriedAt,
                          ).toLocaleString("pt-BR", {
                            timeZone: "America/Fortaleza",
                          })}
                          {data.cached ? " · em cache" : ""}. A fonte pode
                          alterar o preço.
                        </small>
                        {o.delivery && (
                          <p className="parts-delivery">{o.delivery}</p>
                        )}
                        <span className="parts-origin">
                          Fonte: {o.source}
                          {o.destination === "shopping"
                            ? " · detalhes no Google Shopping"
                            : ` · ${o.host}`}
                        </span>
                        <a
                          className="button"
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                        >
                          VER OFERTA / COMPRAR <ArrowUpRight size={16} />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
                {visible.length === 0 && (
                  <p>
                    Nenhuma oferta corresponde aos filtros desta página.
                    Experimente outra loja ou remova o filtro de foto.
                  </p>
                )}
              </>
            )}
            {data.offers.length === 0 &&
              ["ready", "partial"].includes(data.status) && (
                <div className="parts-search-status">
                  <PackageSearch size={32} />
                  <h3>Nenhuma oferta foi retornada para estes termos.</h3>
                  <p>
                    Tente o código da peça, outra descrição ou uma versão mais
                    específica do veículo.
                  </p>
                </div>
              )}
            {active && (
              <div className="parts-pagination">
                {active.page > 1 && (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => run(active, active.page - 1)}
                  >
                    ← Página anterior
                  </button>
                )}
                {(data.status === "ready" || data.status === "partial") && (
                  <span>Página {data.page} · até 5 páginas por pesquisa</span>
                )}
                {data.hasNext && (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => run(active, active.page + 1)}
                  >
                    Página seguinte →
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {!active && !busy && (
          <div className="parts-search-status">
            <PackageSearch size={32} />
            <h3>Comece com a peça que você procura.</h3>
            <p>
              Adicionar o veículo e o código ajuda a refinar as ofertas
              encontradas.
            </p>
          </div>
        )}
      </div>
      {searchText.trim().length >= 2 && (
        <div className="parts-external-search">
          <h3>Pesquisar também nos sites</h3>
          <p>
            Estes são atalhos de pesquisa externa, não anúncios já consultados.
          </p>
          <div>
            {externalPartsSearches(searchText).map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {s.name} <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="parts-price-note">
        A compra é concluída no site de origem. Preços, disponibilidade, frete e
        compatibilidade devem ser conferidos no anúncio. A consulta cobre as
        fontes conectadas e não garante cobertura de todas as lojas da internet.
      </p>
    </section>
  );
}
