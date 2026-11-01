"use client";
import { useState } from "react";
import { engines, engineParts, layoutNames } from "@/lib/engines";
import { EngineDiagram } from "./engine-diagram";

export function EngineCatalog() {
  const [maker, setMaker] = useState("");
  const [query, setQuery] = useState("");
  const [engineId, setEngineId] = useState(
    engines.find((e) => e.family === "M264")!.id,
  );
  const [part, setPart] = useState(3);
  const engine = engines.find((e) => e.id === engineId)!;
  const filtered = engines.filter(
    (e) =>
      (!maker || e.maker === maker) &&
      `${e.maker} ${e.family}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          query
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
  );
  const makers = [...new Set(engines.map((e) => e.maker))];
  function choose(id: string) {
    setEngineId(id);
    setPart(3);
    document.getElementById("engine-detail")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  return (
    <>
      <div className="engine-intro">
        <span className="eyebrow">EDSON OFICINA / ATLAS DE MOTORES</span>
        <h1>
          Por dentro de
          <br />
          <em>cada motor.</em>
        </h1>
        <p>
          Explore famílias nacionais e importadas. Separe os conjuntos,
          reconheça os componentes e entenda como tudo se conecta.
        </p>
        <div className="engine-counts">
          <span>
            <strong>{engines.length}</strong> famílias e versões
          </span>
          <span>
            <strong>{makers.length}</strong> grupos de fabricantes
          </span>
          <span>
            <strong>07</strong> conjuntos principais
          </span>
        </div>
      </div>
      <section
        className="engine-detail"
        id="engine-detail"
        aria-label="Motor selecionado"
      >
        <div className="engine-detail-heading">
          <div>
            <span className="eyebrow">{engine.maker}</span>
            <h2>{engine.family}</h2>
            <p>{layoutNames[engine.layout]}</p>
          </div>
          <span className="engine-chip">VISTA EXPLODIDA / DIDÁTICA</span>
        </div>
        <div className="engine-workbench">
          <div className="engine-drawing">
            <EngineDiagram
              cylinders={
                engine.layout === "I3"
                  ? 3
                  : engine.layout === "I6" || engine.layout === "V6"
                    ? 6
                    : 4
              }
              v={engine.layout === "V6"}
              selected={part}
              onSelect={setPart}
            />
            <p>
              {engine.layout === "variavel"
                ? "Arquitetura ilustrativa de quatro cilindros; a configuração real depende da versão."
                : `Arquitetura ilustrativa: ${layoutNames[engine.layout].toLowerCase()}.`}{" "}
              Não é um desenho específico de peças desta família.
            </p>
          </div>
          <div className="engine-parts">
            <span className="eyebrow">EXPLORE OS COMPONENTES</span>
            <h3>Do cabeçote ao cárter.</h3>
            <p>Selecione um conjunto para conhecer sua função.</p>
            <div className="engine-part-list">
              {engineParts.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={part === i}
                  onClick={() => setPart(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {p.name}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="engine-part-description" aria-live="polite">
              <span className="eyebrow">{engineParts[part].system}</span>
              <h4>{engineParts[part].name}</h4>
              <p>{engineParts[part].text}</p>
            </div>
          </div>
        </div>
        {engine.note && <p className="notice">{engine.note}</p>}
        <p className="engine-disclaimer">
          Ilustração educativa simplificada e representativa da arquitetura. A
          identificação exata de peças, distribuição, acessórios e procedimentos
          exige o código completo do motor e a documentação técnica da versão.
          As posições não indicam sequência de desmontagem ou montagem.
        </p>
      </section>
      <section className="engine-library" aria-label="Catálogo de motores">
        <div className="section-title">
          <div>
            <span className="eyebrow">NACIONAIS E IMPORTADOS</span>
            <h2>Escolha uma família.</h2>
          </div>
          <span>{filtered.length} resultados</span>
        </div>
        <div className="engine-filters">
          <label>
            Fabricante
            <select value={maker} onChange={(e) => setMaker(e.target.value)}>
              <option value="">Todos os fabricantes</option>
              {makers.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Buscar motor
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="AP, EA888, E.torQ, B58…"
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setMaker("");
              setQuery("");
            }}
          >
            Limpar filtros
          </button>
        </div>
        <div className="engine-family-grid">
          {filtered.map((e) => (
            <button
              type="button"
              className="engine-family-card"
              key={e.id}
              aria-pressed={engine.id === e.id}
              onClick={() => choose(e.id)}
            >
              <span className="eyebrow">{e.maker}</span>
              <span className="engine-family-thumb" aria-hidden="true">
                <EngineDiagram
                  cylinders={
                    e.layout === "I3"
                      ? 3
                      : e.layout === "I6" || e.layout === "V6"
                        ? 6
                        : 4
                  }
                  v={e.layout === "V6"}
                />
              </span>
              <span className="engine-family-name">{e.family}</span>
              <span className="engine-family-layout">
                {layoutNames[e.layout]}
              </span>
              <span className="engine-family-footer">
                <span>Explorar vista explodida</span>
                <b aria-hidden="true">↗</b>
              </span>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <p className="empty">
            Nenhum motor encontrado. Tente outra família ou limpe os filtros.
          </p>
        )}
      </section>
      <section className="engine-atlas-art">
        <span className="eyebrow">ARQUITETURAS / REFERÊNCIA VISUAL</span>
        <h2>Uma linguagem visual. Diferentes configurações.</h2>
        <img
          src="/images/engines/architecture-atlas.webp"
          alt="Ilustração conceitual em vista explodida de motores de quatro cilindros em linha, seis em linha e seis em V"
          width="1536"
          height="1024"
          loading="lazy"
        />
        <p>
          Arte conceitual gerada por IA. Representa arquiteturas gerais; não
          substitui um diagrama técnico do fabricante.
        </p>
      </section>
    </>
  );
}
