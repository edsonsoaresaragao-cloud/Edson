"use client";
import { engineParts, type Engine } from "@/lib/engines";
import visuals from "@/lib/engine-visuals.json";

const sheetParts = [
  { number: 1, label: "Tampa de válvulas", part: 0 },
  { number: 6, label: "Cabeçote e válvulas", part: 1 },
  { number: 7, label: "Junta do cabeçote", part: 2 },
  { number: 8, label: "Bloco do motor", part: 3 },
  { number: 9, label: "Pistões e anéis", part: 4 },
  { number: 10, label: "Bielas", part: 4 },
  { number: 11, label: "Virabrequim", part: 5 },
  { number: 12, label: "Cárter de óleo", part: 6 },
];
// Approximate assembly regions, never bolt positions or assembly instructions.
const regions = [
  [72, 8],
  [66, 25],
  [65, 33],
  [64, 45],
  [64, 61],
  [69, 68],
  [66, 76],
  [64, 91],
];
const vRegions = [
  [80, 20],
  [82, 36],
  [81, 42],
  [75, 53],
  [77, 63],
  [80, 69],
  [75, 77],
  [72, 92],
];

function Subassembly({
  title,
  cell,
  description,
}: {
  title: string;
  cell: number;
  description: string;
}) {
  return (
    <section className="sheet-subassembly">
      <h4>{title}</h4>
      <div
        className={`sheet-subassembly-art sheet-art-${cell}`}
        role="img"
        aria-label={`Ilustração funcional genérica: ${title}`}
      />
      <p>{description}</p>
    </section>
  );
}

export function EngineSheet({
  engine,
  selected,
  onSelect,
}: {
  engine: Engine;
  selected: number;
  onSelect: (part: number) => void;
}) {
  const visual = visuals.find((v) => v.id === engine.id)!;
  const points = engine.layout === "V6" ? vRegions : regions;
  const turbo = [
    "EA888",
    "CSS Prime",
    "GSE T200",
    "GSE T270",
    "HR10",
    "EcoBoost",
    "M264",
    "M274",
    "OM651",
    "OM654",
    "N20",
    "B48",
    "B58",
    "N57",
  ].includes(engine.family);
  const belt = [
    "AP 1.6",
    "AP 1.8",
    "AP 2.0",
    "EA111",
    "Família I",
    "Família II",
    "CSS Prime",
    "K4M",
  ].includes(engine.family);
  return (
    <div
      className="engine-sheet"
      aria-label={`Ficha ilustrada em vista explodida: ${engine.maker} ${engine.family}`}
    >
      <header className="sheet-header">
        <div className="sheet-brand">
          <span>EDSON OFICINA</span>
          <strong>{engine.maker}</strong>
        </div>
        <div className="sheet-title">
          <h3>
            Vista Explodida <span>(Exploded View)</span>
          </h3>
          <p>
            Motor {engine.family} · {visual.referenceVersion}
          </p>
          <small>
            {visual.cylinders} cilindros{" "}
            {engine.layout === "V6" ? "em V" : "em linha"} · Interpretação
            educativa
          </small>
        </div>
      </header>
      <div className="sheet-body">
        <aside className="sheet-left">
          <section className="sheet-panel">
            <h4>Componentes principais</h4>
            <ol className="sheet-component-list">
              {sheetParts.map((p, i) => (
                <li key={p.number}>
                  <button
                    type="button"
                    aria-pressed={selected === p.part}
                    onClick={() => onSelect(p.part)}
                  >
                    <span>{p.number}</span>
                    {p.label}
                  </button>
                </li>
              ))}
            </ol>
            <p className="sheet-panel-note">
              A numeração identifica regiões aproximadas da ilustração. Não
              representa ordem de desmontagem.
            </p>
          </section>
          <section className="sheet-panel sheet-specs">
            <h4>Identificação da referência</h4>
            <dl>
              <div>
                <dt>Fabricante</dt>
                <dd>{engine.maker}</dd>
              </div>
              <div>
                <dt>Família</dt>
                <dd>{engine.family}</dd>
              </div>
              <div>
                <dt>Versão ilustrada</dt>
                <dd>{visual.referenceVersion}</dd>
              </div>
              <div>
                <dt>Configuração</dt>
                <dd>
                  {visual.cylinders} cilindros{" "}
                  {engine.layout === "V6" ? "em V" : "em linha"}
                </dd>
              </div>
            </dl>
            <p className="sheet-panel-note">
              Cilindrada, potência, torque e procedimentos devem ser conferidos
              na documentação do código e ano do motor.
            </p>
          </section>
          <div className="sheet-selected" aria-live="polite">
            <strong>{engineParts[selected].name}</strong>
            <p>{engineParts[selected].text}</p>
          </div>
        </aside>
        <figure className="sheet-main">
          <div className="sheet-engine-image">
            <img
              src={visual.image}
              alt={`Ilustração gerada em vista explodida de ${engine.maker} ${engine.family}`}
              width={1024}
              height={1536}
            />
            {sheetParts.map((p, i) => (
              <button
                key={p.number}
                type="button"
                className="sheet-marker"
                style={{ left: `${points[i][0]}%`, top: `${points[i][1]}%` }}
                aria-label={`${p.number}. ${p.label}`}
                aria-pressed={selected === p.part}
                onClick={() => onSelect(p.part)}
              >
                {p.number}
              </button>
            ))}
          </div>
          <figcaption>
            ILUSTRAÇÃO GERADA POR IA · NÃO É FOTOGRAFIA
            <br />
            Regiões indicativas; não é um desenho técnico certificado.
          </figcaption>
        </figure>
        <aside className="sheet-right">
          <h3>Subconjuntos em detalhe</h3>
          <p className="sheet-panel-note">
            Exemplos funcionais genéricos, sem correspondência de peças ou
            medidas com esta versão.
          </p>
          {turbo && (
            <Subassembly
              title="Turbocompressor (16)"
              cell={0}
              description="Carcaças, eixo e rodas da turbina e do compressor. Exemplo funcional."
            />
          )}
          <Subassembly
            title="Cabeçote e válvulas (6)"
            cell={1}
            description="Comandos, válvulas, molas e cabeçote. A arquitetura varia por motor."
          />
          <Subassembly
            title="Sistema de distribuição (20)"
            cell={belt ? 3 : 2}
            description={
              belt
                ? "Exemplo de correia dentada, polias e tensor. Consulte a versão."
                : "Exemplo de corrente, engrenagens, guias e tensionador. Consulte a versão."
            }
          />
          <Subassembly
            title="Sistema de lubrificação"
            cell={4}
            description="Bomba de óleo, filtro e trocador de calor: funções gerais."
          />
          <Subassembly
            title="Sistema de arrefecimento"
            cell={5}
            description="Bomba d’água, válvula termostática e radiador: funções gerais."
          />
        </aside>
      </div>
      <footer className="sheet-footer">
        <span>EDSON OFICINA · ATLAS DE MOTORES</span>
        <span>
          Fonte visual: {new URL(visual.sourceUrl).hostname} ·{" "}
          {visual.referenceVersion}
        </span>
      </footer>
    </div>
  );
}
