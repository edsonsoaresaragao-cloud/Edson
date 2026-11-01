export const compressorParts = [
  [
    "Polia",
    "Recebe o movimento da correia. Neste exemplo com embreagem, pode girar mesmo com o eixo do compressor desacoplado.",
  ],
  [
    "Rolamento da polia",
    "Permite a rotação da polia em relação ao apoio frontal.",
  ],
  [
    "Placa da embreagem",
    "Acopla a polia ao eixo quando a bobina é energizada. O deslocamento mostrado é ampliado para estudo.",
  ],
  ["Eixo", "Transmite rotação ao mecanismo de compressão."],
  ["Carcaça frontal", "Apoia o eixo e aloja a região do retentor."],
  [
    "Carcaça principal",
    "Aloja os cilindros e o conjunto interno. Alterne para corte para observar os pistões.",
  ],
  [
    "Bobina magnética",
    "Gera o campo que atua na embreagem; a bobina permanece fixa enquanto a polia gira.",
  ],
  [
    "Pistões / placa oscilante",
    "A placa inclinada ligada ao eixo produz o movimento alternado dos pistões axiais neste modelo didático.",
  ],
  [
    "Placa de válvulas",
    "Separa as câmaras e controla admissão e descarga por válvulas.",
  ],
  [
    "Tampa traseira",
    "Fecha o conjunto e abriga galerias de passagem do refrigerante.",
  ],
  [
    "Fluxo de sucção e descarga",
    "Setas azuis indicam entrada de vapor em baixa pressão; vermelhas indicam saída em alta pressão. Na imagem, os itens 11 e 14 se referem às mesmas conexões; aqui o 11 identifica apenas o fluxo.",
  ],
  [
    "Retentor do eixo",
    "Veda a região do eixo, contribuindo para conter óleo e refrigerante.",
  ],
  [
    "Chicote / conector elétrico",
    "Alimenta a bobina da embreagem neste exemplo. Características elétricas dependem do compressor.",
  ],
  [
    "Conexões de sucção e descarga",
    "Portas físicas conectadas às linhas de baixa e alta pressão do sistema A/C.",
  ],
  [
    "Parafusos de fixação",
    "Fixam tampas e carcaças. O modelo não especifica torque nem ordem de aperto.",
  ],
  [
    "Vedações / O-rings",
    "Vedam interfaces entre as peças. Material e dimensões variam conforme a aplicação.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type CompressorState = {
  explosion: number;
  speed: number;
  selected: number;
  engaged: boolean;
  cutaway: boolean;
};
export const initialCompressorState: CompressorState = {
  explosion: 0,
  speed: 0.5,
  selected: 8,
  engaged: true,
  cutaway: true,
};
export const pistonRadius = 0.39,
  plateTilt = 0.32;
export function pistonPosition(angle: number, phase: number) {
  return 0.5 + pistonRadius * Math.tan(plateTilt) * Math.cos(phase - angle);
}
