export const steeringParts = [
  [
    "Volante",
    "Comando do motorista. Seu giro é ligado à coluna e ao pinhão neste modelo didático.",
  ],
  [
    "Coluna de direção",
    "Transmite o giro ao mecanismo da caixa através do eixo e das articulações.",
  ],
  [
    "Bomba hidráulica",
    "Bomba acionada pelo motor que fornece vazão ao sistema. A pressão depende da carga e do comando da válvula; o modelo não calcula pressão.",
  ],
  [
    "Reservatório do fluido",
    "Armazena fluido e alimenta a sucção da bomba, recebendo o retorno da caixa.",
  ],
  [
    "Mangueira de alta pressão",
    "Liga a saída da bomba à válvula da caixa. A indicação de circulação não é medição de pressão.",
  ],
  [
    "Mangueira de retorno",
    "Leva o fluido da caixa ao reservatório em baixa pressão relativa.",
  ],
  [
    "Caixa / cremalheira hidráulica",
    "Converte rotação em deslocamento lateral, com assistência aplicada ao pistão da cremalheira.",
  ],
  [
    "Pinhão / válvula de comando",
    "Engrena com a cremalheira. O comando hidráulico distribui assistência conforme o esforço aplicado; o exemplo associa sua indicação ao esterçamento.",
  ],
  ["Barras axiais", "Transmitem o deslocamento da cremalheira aos terminais."],
  [
    "Terminais de direção",
    "Articulações entre as barras e as mangas de eixo. Permitem o esterçamento.",
  ],
  [
    "Semieixos",
    "Conduzem torque às rodas e acompanham a articulação da suspensão. Não são acionados pela bomba hidráulica.",
  ],
  [
    "Bandejas / braços de suspensão",
    "Guiam a posição das rodas e transmitem esforços ao agregado.",
  ],
  [
    "Molas helicoidais",
    "Elementos elásticos que suportam cargas. Coxins superiores também aparecem neste conjunto.",
  ],
  [
    "Amortecedores",
    "Controlam oscilações do conjunto. A geometria da suspensão é ilustrativa.",
  ],
  ["Pivôs", "Permitem articulação entre bandejas e mangas de eixo."],
  [
    "Discos de freio",
    "Giram com as rodas durante o deslocamento do veículo. Aqui ficam sem rotação para facilitar a leitura do esterçamento parado.",
  ],
  [
    "Pinças de freio",
    "Acompanham o esterçamento sem girar com o disco. Suportes também são mostrados.",
  ],
  [
    "Agregado e buchas (contexto)",
    "Estrutura de apoio e seus pontos de fixação, adicionados para contextualizar o módulo dianteiro.",
  ],
  [
    "Cubos e mangas (contexto)",
    "Apoiam o conjunto das rodas e recebem o comando dos terminais.",
  ],
  [
    "Estabilizadora e bieletas (contexto)",
    "Conjunto de ligação transversal reaproveitado da arquitetura McPherson de referência.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type SteeringState = {
  explosion: number;
  steering: number;
  selected: number;
  automatic: boolean;
  assist: boolean;
};
export const initialSteeringState: SteeringState = {
  explosion: 0,
  steering: 0,
  selected: 7,
  automatic: true,
  assist: true,
};
export function steeringPose(wheelDegrees: number) {
  const wheel = Math.min(360, Math.max(-360, wheelDegrees));
  return {
    wheel,
    roadDegrees: (wheel * 25) / 360,
    rack: ((wheel * Math.PI) / 180) * 0.035,
  };
}
export function hydraulicDirection(wheel: number, assist: boolean) {
  return !assist
    ? "off"
    : Math.abs(wheel) < 1
      ? "neutral"
      : wheel < 0
        ? "left"
        : "right";
}
