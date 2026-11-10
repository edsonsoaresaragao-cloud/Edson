"use client";
import { useId, useState } from "react";
import type { DiagnosticCase } from "@/lib/alternator-diagnosis/schema";
import { interpretMeasurements } from "@/lib/alternator-diagnosis/rules";
export function MeasurementChart({ data }: { data: DiagnosticCase }) {
  const [kind, setKind] = useState("voltage");
  const readings = interpretMeasurements(data).filter(
    (r) =>
      (kind === "voltage"
        ? ["rest", "crank", "idle", "loaded", "bplus", "ecu"]
        : ["current", "excitationCurrent", "sleepCurrent"]
      ).includes(r.id) && r.value !== null,
  );
  const max = Math.max(
    16,
    ...readings.flatMap((r) => [r.value || 0, r.max || 0]),
  );
  return (
    <figure className="ad-chart">
      <figcaption>
        Medições registradas · ensaios distintos, sem série temporal
      </figcaption>
      <label>
        Grandeza do gráfico
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="voltage">Tensão (V)</option>
          <option value="current">Corrente (A)</option>
        </select>
      </label>
      {readings.length ? (
        <svg
          viewBox="0 0 700 230"
          role="img"
          aria-label={`Comparação de ${kind === "voltage" ? "tensão (V)" : "corrente (A)"}; barras amarelas são medições reais.`}
        >
          {readings.map((r, i) => (
            <g key={r.id}>
              <text x="0" y={27 + i * 33}>
                {r.label}
              </text>
              <rect
                x="270"
                y={11 + i * 33}
                width={((r.value || 0) / max) * 330}
                height="18"
                fill="#f7cb55"
              />
              <text x="610" y={26 + i * 33}>
                {r.value?.toFixed(2)}
              </text>
              {r.min !== null && r.state !== "evidência insuficiente" && (
                <line
                  x1={270 + (r.min / max) * 330}
                  x2={270 + (r.min / max) * 330}
                  y1={8 + i * 33}
                  y2={32 + i * 33}
                  stroke="#4ed2ba"
                />
              )}
            </g>
          ))}
        </svg>
      ) : (
        <p>
          Sem medições registradas. Nenhum dado de veículo foi simulado neste
          gráfico.
        </p>
      )}
    </figure>
  );
}
export function ScopeLesson() {
  const [kind, setKind] = useState("normal"),
    [scale, setScale] = useState("1");
  const descriptions: Record<string, string> = {
    normal:
      "Padrão didático de retificação com pulsos regulares. Amplitude depende de carga, rotação, medição e aplicação.",
    open: "Pulso ausente ou depressão periódica pode orientar a investigação de diodo aberto. Confirmar em ensaio isolado.",
    short:
      "Deformação e oscilações podem ser compatíveis com curto, mas não identificam sozinhas diodo defeituoso.",
    stator:
      "Assimetria entre pulsos pode motivar avaliação das fases do estator e das conexões.",
  };
  const path = Array.from({ length: 421 }, (_, i) => {
    const t = i / 420;
    let y = Math.abs(Math.sin(t * 12 * Math.PI)) * 0.16;
    if (kind === "open" && Math.floor(t * 12) % 4 === 1) y += 0.48;
    if (kind === "short")
      y += 0.15 * Math.sin(t * 40 * Math.PI) + 0.2 * Math.sin(t * 4 * Math.PI);
    if (kind === "stator") y *= 1 + 0.9 * Math.sin(t * 4 * Math.PI);
    return `${i ? "L" : "M"}${40 + t * 600},${130 - y * Number(scale) * 95}`;
  }).join(" ");
  return (
    <section>
      <h3>Formas de onda educativas</h3>
      <p>
        Exemplos sintéticos de padrão, sem escala de aprovação e sem aquisição
        do veículo. Mudar a ilustração não altera o diagnóstico.
      </p>
      <label>
        Padrão ilustrado
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="normal">Retificação regular</option>
          <option value="open">Possível diodo aberto</option>
          <option value="short">Possível curto</option>
          <option value="stator">Assimetria de fases</option>
        </select>
      </label>
      <label>
        Ampliação vertical ilustrativa
        <select value={scale} onChange={(e) => setScale(e.target.value)}>
          <option value="1">1×</option>
          <option value="2">2×</option>
        </select>
      </label>
      <svg
        className="ad-wave"
        viewBox="0 0 700 210"
        role="img"
        aria-label={descriptions[kind]}
      >
        <path d="M40 20V170H660 M40 130H660" stroke="#536c89" fill="none" />
        <path d={path} fill="none" stroke="#f7cb55" strokeWidth="3" />
        <text x="45" y="196">
          Tempo e amplitude relativos · não é captura de osciloscópio
        </text>
      </svg>
      <p>{descriptions[kind]}</p>
      <p>
        AC RMS no multímetro e pico a pico no osciloscópio não são
        intercambiáveis. Registre acoplamento AC/DC, sonda, atenuação, base de
        tempo, ponto de massa e condições. Não há limite universal de ripple.
      </p>
    </section>
  );
}
export function Circuit() {
  const id = useId();
  const [test, setTest] = useState("positive"),
    [moving, setMoving] = useState(false),
    [part, setPart] = useState("Saída B+ e cabo positivo sob carga.");
  return (
    <figure className="ad-circuit">
      <figcaption>
        Conexão ilustrada de teste · identificar pinagem e acesso seguro
      </figcaption>
      <label>
        Teste ilustrado
        <select value={test} onChange={(e) => setTest(e.target.value)}>
          <option value="positive">Queda positiva: B+ → polo positivo</option>
          <option value="ground">
            Queda negativa: carcaça → polo negativo
          </option>
        </select>
      </label>
      <button
        type="button"
        aria-pressed={moving}
        onClick={() => setMoving((v) => !v)}
      >
        {moving ? "Pausar fluxo ilustrativo" : "Animar fluxo ilustrativo"}
      </button>
      <svg
        viewBox="0 0 700 260"
        role="img"
        aria-label={
          test === "positive"
            ? "Voltímetro em paralelo entre saída B+ do alternador e polo positivo da bateria."
            : "Voltímetro em paralelo entre carcaça do alternador e polo negativo da bateria."
        }
      >
        <defs>
          <path id={`${id}-flow`} d="M150 100H550V190H150Z" />
        </defs>
        <path
          d="M150 100H550V190H150Z"
          fill="none"
          stroke="#557592"
          strokeWidth="5"
        />
        <circle cx="120" cy="145" r="60" fill="#18354d" stroke="#adc8da" />
        <text x="65" y="145">
          Alternador
        </text>
        <rect
          x="550"
          y="65"
          width="105"
          height="145"
          rx="15"
          fill="#18354d"
          stroke="#adc8da"
        />
        <text x="558" y="135">
          Bateria
        </text>
        <text x="570" y="94">
          +
        </text>
        <text x="570" y="193">
          −
        </text>
        <path
          d={
            test === "positive" ? "M165 100V40H550V100" : "M165 190V230H550V190"
          }
          fill="none"
          stroke="#f7cb55"
          strokeWidth="3"
        />
        <rect
          x="315"
          y={test === "positive" ? 15 : 209}
          width="90"
          height="40"
          rx="6"
          fill="#112337"
          stroke="#f7cb55"
        />
        <text x="335" y={test === "positive" ? 42 : 236}>
          V DC
        </text>
        {moving && (
          <circle r="6" fill="#54e6cf">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath href={`#${id}-flow`} />
            </animateMotion>
          </circle>
        )}
      </svg>
      <div>
        {[
          "Saída B+ e cabo positivo sob carga.",
          "Carcaça e aterramentos até o polo negativo.",
          "ECU comanda excitação por interface confirmada; não aplicar tensão ao sinal.",
        ].map((text) => (
          <button type="button" key={text} onClick={() => setPart(text)}>
            {text.split(" ").slice(0, 3).join(" ")}
          </button>
        ))}
      </div>
      <p role="status">{part}</p>
      <p>
        Voltímetro mede diferença de potencial em paralelo. O fluxo animado
        representa o circuito de potência; não é leitura real de corrente ou de
        rede LIN.
      </p>
    </figure>
  );
}
