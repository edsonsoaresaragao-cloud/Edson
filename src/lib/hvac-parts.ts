export const hvacParts = [
  [
    "Compressor",
    "Aspira vapor em baixa pressão e comprime o refrigerante, elevando sua pressão e temperatura. A polia e o mecanismo são representações didáticas.",
  ],
  [
    "Condensador",
    "Rejeita calor para o ar externo. O refrigerante se condensa, saindo predominantemente líquido em alta pressão.",
  ],
  [
    "Eletroventilador do condensador",
    "Força a passagem de ar externo pelo condensador, ajudando a dissipar calor.",
  ],
  [
    "Filtro secador",
    "Retém umidade e impurezas no circuito de alta pressão deste exemplo com válvula de expansão. Acumulador e filtro secador têm posições e funções diferentes conforme a arquitetura.",
  ],
  [
    "Válvula de expansão",
    "Controla a alimentação do evaporador e provoca queda de pressão, formando uma mistura fria de líquido e vapor.",
  ],
  [
    "Evaporador",
    "Absorve calor do ar da cabine. O refrigerante evapora e a umidade do ar pode condensar sobre suas aletas.",
  ],
  [
    "Blower / ventilador da cabine",
    "Impulsiona ar através do filtro e dos trocadores de calor até os difusores. Velocidade ajustável no modelo.",
  ],
  [
    "Filtro de cabine",
    "Retém partículas presentes no ar antes de sua passagem pelos trocadores neste exemplo.",
  ],
  [
    "Caixa HVAC",
    "Aloja os trocadores e direciona o ar por meio de portas de distribuição e mistura. Mostrada em corte para revelar o interior.",
  ],
  [
    "Dutos e difusores",
    "Distribuem o ar condicionado para o habitáculo. As setas mostram o sentido ilustrativo do fluxo.",
  ],
  [
    "Linhas do refrigerante",
    "Conectam compressor, condensador, filtro secador, válvula e evaporador. Cores indicam trechos de alta e baixa pressão; não representam cores reais de mangueiras.",
  ],
  [
    "Portas de serviço / sensores",
    "Pontos de conexão e monitoramento do circuito. Posição e quantidade variam por aplicação.",
  ],
  [
    "Aquecedor da cabine (opcional)",
    "Trocador ligado ao circuito de arrefecimento do motor, separado do refrigerante do A/C. A mistura de ar permite ajustar a temperatura de saída.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type HvacState = {
  explosion: number;
  speed: number;
  selected: number;
  cooling: boolean;
};
export const initialHvacState: HvacState = {
  explosion: 0,
  speed: 0.6,
  selected: 1,
  cooling: true,
};
