"use client";
import { useEffect, useState } from "react";
export function TimingDiagram() {
  const [angle, setAngle] = useState(0),
    [offset, setOffset] = useState(0),
    [mode, setMode] = useState("interferente"),
    [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setAngle((v) => (v + 6) % 720), 80);
    return () => clearInterval(timer);
  }, [running]);
  const phase = (angle + offset + 720) % 720;
  const opening = (start: number) =>
    phase >= start && phase <= start + 180
      ? Math.sin(((phase - start) * Math.PI) / 180) * 34
      : 0;
  const intake = opening(0),
    exhaust = opening(540);
  const piston =
    140 +
    (1 - Math.cos((angle * Math.PI) / 180)) * 60 +
    (mode === "nao-interferente" ? 50 : 0);
  const contact =
    mode === "interferente" &&
    offset !== 0 &&
    piston < 158 &&
    Math.max(intake, exhaust) > 13;
  const stroke = ["Admissão", "Compressão", "Expansão", "Escape"][
    Math.min(3, Math.floor(angle / 180))
  ];
  return (
    <section className="academy-timing" aria-label="Exploração do sincronismo">
      <h3>Explore pistão, válvulas e sincronismo</h3>
      <p>
        Esquema conceitual, sem escala ou marcas de reparação. As aberturas são
        simplificadas; o cruzamento real varia por projeto. A fase artificial
        demonstra o risco, não simula um motor específico.
      </p>
      <div className="academy-diagram-grid">
        <svg
          viewBox="0 0 420 390"
          role="img"
          aria-label={`Pistão e válvulas: ${stroke}, virabrequim ${angle} graus; comando com defasagem de ${offset} graus de virabrequim.`}
        >
          <defs>
            <linearGradient id="piston-metal" x2="1" y2="1">
              <stop stopColor="#dce8f0" />
              <stop offset=".5" stopColor="#728a9e" />
              <stop offset="1" stopColor="#dce8f0" />
            </linearGradient>
          </defs>
          <rect
            x="98"
            y="88"
            width="224"
            height="240"
            rx="18"
            fill="#0b1a29"
            stroke="#8ba7bb"
            strokeWidth="8"
          />
          <path d="M90 90H330" stroke="#ff7b11" strokeWidth="12" />
          <g transform={`translate(0 ${intake})`}>
            <path d="M153 42V123" stroke="#77cdfa" strokeWidth="12" />
            <ellipse cx="153" cy="123" rx="30" ry="9" fill="#77cdfa" />
          </g>
          <g transform={`translate(0 ${exhaust})`}>
            <path d="M267 42V123" stroke="#ffa884" strokeWidth="12" />
            <ellipse cx="267" cy="123" rx="30" ry="9" fill="#ffa884" />
          </g>
          <text x="105" y="25" fill="#bde9ff" fontSize="15">
            Admissão
          </text>
          <text x="244" y="25" fill="#ffd0b9" fontSize="15">
            Escape
          </text>
          <g transform={`translate(0 ${piston})`}>
            <rect
              x="109"
              width="202"
              height="53"
              rx="7"
              fill="url(#piston-metal)"
              stroke={contact ? "#ff5858" : "#e3ecf3"}
              strokeWidth="3"
            />
            <path d="M111 13H309M111 22H309" stroke="#526577" strokeWidth="3" />
            <path d="M210 53V85" stroke="#b4c6d5" strokeWidth="20" />
          </g>
          <text x="130" y="365" fill="#eef6fd" fontSize="18">
            {stroke} · {angle}°
          </text>
        </svg>
        <div className="form">
          <label>
            Projeto conceitual
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setRunning(false);
              }}
            >
              <option value="interferente">Interferente</option>
              <option value="nao-interferente">Não interferente</option>
              <option value="sem-fonte">Sem confirmação técnica</option>
            </select>
          </label>
          <label>
            Virabrequim: {angle}°
            <input
              aria-label="Ângulo do virabrequim"
              type="range"
              min="0"
              max="719"
              step="1"
              value={angle}
              onChange={(e) => {
                setRunning(false);
                setAngle(Number(e.target.value));
              }}
            />
          </label>
          <label>
            Defasagem didática: {offset}° de virabrequim
            <input
              aria-label="Defasagem didática"
              type="range"
              min="-120"
              max="120"
              step="10"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
            />
          </label>
          <p>
            Comando: {(angle / 2).toFixed(1)}° de rotação no ciclo. Relação 2:1
            com o virabrequim.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => setRunning((v) => !v)}
            >
              {running ? "Pausar movimento" : "Animar ciclo"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setRunning(false);
                setAngle(0);
                setOffset(0);
              }}
            >
              Restaurar esquema
            </button>
          </div>
        </div>
      </div>
      <p
        className={contact ? "academy-warning" : "academy-note"}
        role="status"
        aria-label="Situação do esquema"
      >
        {mode === "sem-fonte"
          ? "Sem confirmação técnica: o esquema não pode estabelecer a geometria real. Adote cuidado conservador até consultar a aplicação exata."
          : mode === "nao-interferente"
            ? "Nesta representação, o projeto mantém espaço entre os componentes. Isso não classifica nenhum motor real da tabela."
            : contact
              ? "Região de possível contato na demonstração fora de fase. Em um motor real com suspeita de colisão, não acione nem force a rotação."
              : "Em fase, os movimentos precisam manter a relação projetada. Explore a defasagem para observar situações de risco."}
      </p>
    </section>
  );
}
