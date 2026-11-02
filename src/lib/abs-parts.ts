export const absParts = [
  [
    "Sensores de velocidade (4 rodas)",
    "Informam a rotação das rodas à ECU. O exemplo mostra sensores junto aos anéis de leitura, com sinais ilustrativos.",
  ],
  [
    "ECU do ABS",
    "Processa as leituras e comanda as válvulas e a bomba para modular a pressão quando identifica tendência de bloqueio.",
  ],
  [
    "Unidade hidráulica / modulador",
    "Bloco com galerias que conectam cilindro-mestre, válvulas, acumuladores e circuitos das rodas.",
  ],
  [
    "Válvulas solenoides",
    "Oito válvulas neste exemplo de quatro canais: entrada e saída por roda. A demonstração destaca um canal nas fases de aumentar, manter e reduzir pressão.",
  ],
  [
    "Motor elétrico da bomba",
    "Aciona a bomba de recirculação. O fluido liberado da roda é recolhido e devolvido ao circuito dentro do modulador, sem ser simplesmente descartado no reservatório.",
  ],
  [
    "Reservatório do fluido de freio",
    "Alimenta o cilindro-mestre e compensa variações de volume. O fluido indicado depende do fabricante.",
  ],
  [
    "Cilindro-mestre",
    "Converte o acionamento do pedal em pressão hidráulica. Dois circuitos são representados, sem definição de divisão ou roteamento de um veículo específico.",
  ],
  [
    "Tubulações e galerias",
    "Conduzem o fluido entre os conjuntos. Linhas externas e caminhos internos são mostrados de forma esquemática, sem prescrever conexões de manutenção.",
  ],
  [
    "Discos, anéis e pinças (contexto)",
    "Conjuntos de freio nas quatro rodas para observar rotação e sensores. As pinças não giram com os discos.",
  ],
  [
    "Pedal e servofreio (contexto)",
    "Representação do acionamento do motorista. A assistência e a mecânica reais variam por veículo.",
  ],
  [
    "Acumuladores de baixa pressão (contexto)",
    "Recebem temporariamente fluido liberado das rodas na redução de pressão. A bomba o recircula para o circuito a montante das válvulas de entrada.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type AbsPhase = "idle" | "apply" | "increase" | "hold" | "reduce";
export type AbsState = {
  explosion: number;
  pedal: number;
  selected: number;
  mode: "normal" | "abs";
};
export const initialAbsState: AbsState = {
  explosion: 0,
  pedal: 0.65,
  selected: 4,
  mode: "abs",
};
export const absPhaseLabels: Record<AbsPhase, string> = {
  idle: "Sem frenagem",
  apply: "Frenagem convencional",
  increase: "Aumentar pressão",
  hold: "Manter pressão",
  reduce: "Reduzir pressão",
};
export function absCycle(time: number, pedal: number, mode: AbsState["mode"]) {
  const p = Math.min(1, Math.max(0, pedal));
  const t = ((time % 3) + 3) % 3;
  const phase: AbsPhase =
    p === 0
      ? "idle"
      : mode === "normal"
        ? "apply"
        : t < 1
          ? "increase"
          : t < 2
            ? "hold"
            : "reduce";
  return {
    phase,
    inletOpen: phase !== "hold" && phase !== "reduce",
    outletOpen: phase === "reduce",
    pumpActive: phase === "reduce",
    pressure:
      p *
      (phase === "increase"
        ? 0.35 + 0.5 * t
        : phase === "hold"
          ? 0.85
          : phase === "reduce"
            ? 0.85 - 0.5 * (t - 2)
            : 1),
    referenceRate: 3 * (1 - 0.4 * p),
    wheelRatio:
      phase === "increase"
        ? 0.6
        : phase === "hold"
          ? 0.75
          : phase === "reduce"
            ? 0.95
            : 1,
  };
}
