export const suspensionParts = [
  [
    "Subchassi / agregado",
    "Estrutura de apoio dos conjuntos dianteiros e de seus pontos de fixação.",
  ],
  [
    "Transmissão (câmbio)",
    "Transmite o torque e define a relação entre rotação do motor e saída para as rodas.",
  ],
  [
    "Diferencial dianteiro",
    "Permite diferença de rotação entre as rodas motrizes. No exemplo transversal, integra o conjunto da transmissão.",
  ],
  [
    "Semieixos",
    "Conduzem o torque do diferencial às rodas, acompanhando articulação e deslocamento da suspensão.",
  ],
  [
    "Junta homocinética externa",
    "Articula a transmissão do movimento junto ao cubo durante o esterçamento.",
  ],
  [
    "Junta homocinética interna",
    "Acomoda articulação e variação de posição do semieixo junto à transmissão.",
  ],
  [
    "Cubo e rolamento de roda",
    "Sustentam a rotação da roda e transferem suas cargas ao conjunto de suspensão.",
  ],
  [
    "Disco de freio ventilado",
    "Gira com o cubo. As pistas recebem o contato das pastilhas durante a frenagem.",
  ],
  [
    "Pinça de freio",
    "Aplica as pastilhas contra o disco. Acompanha a direção, sem girar com o disco.",
  ],
  [
    "Suporte da pinça",
    "Mantém o conjunto da pinça posicionado em relação ao disco.",
  ],
  [
    "Amortecedor",
    "Controla as oscilações, dissipando energia. O modelo mostra o deslocamento do conjunto McPherson.",
  ],
  [
    "Mola helicoidal",
    "Suporta carga e armazena energia elástica; sua altura varia na animação de compressão.",
  ],
  [
    "Torre / coxim superior",
    "Conecta o conjunto superior à carroceria, absorvendo vibrações e permitindo a articulação prevista pelo projeto.",
  ],
  [
    "Bandeja / braço de suspensão",
    "Guia o movimento da roda e transmite esforços aos pontos de fixação no agregado.",
  ],
  ["Pivô da bandeja", "Permite articulação entre bandeja e manga de eixo."],
  [
    "Terminal de direção",
    "Leva o deslocamento do mecanismo de direção ao conjunto da roda.",
  ],
  [
    "Caixa de direção",
    "Converte o comando do volante em deslocamento dos terminais. Assistência depende da aplicação.",
  ],
  [
    "Barra estabilizadora",
    "Liga os lados da suspensão e contribui para controlar a rolagem da carroceria.",
  ],
  [
    "Bieleta da estabilizadora",
    "Transmite esforços entre a barra estabilizadora e o conjunto suspenso.",
  ],
  [
    "Buchas",
    "Permitem movimento controlado e reduzem a transmissão de vibrações nas fixações.",
  ],
].map(([name, description], index) => ({ id: index + 1, name, description }));
export type SuspensionState = {
  explosion: number;
  steering: number;
  amplitude: number;
  selected: number;
};
export const initialSuspensionState: SuspensionState = {
  explosion: 0,
  steering: 0,
  amplitude: 0.65,
  selected: 11,
};
