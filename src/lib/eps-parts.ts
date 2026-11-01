export const epsParts = [
  ["Volante", "Interface do motorista com o comando mecânico da direção."],
  ["Coluna de direção", "Transmite o giro do volante ao conjunto de direção."],
  [
    "Junta universal",
    "Permite transmitir rotação entre eixos desalinhados da coluna neste exemplo.",
  ],
  [
    "Sensor de torque",
    "Detecta o esforço e o sentido aplicado pelo motorista. O destaque deste modelo usa a mudança de comando para ilustrar o sinal, sem calcular torque real.",
  ],
  [
    "ECU da direção",
    "Processa sinais e comanda o motor de assistência. Estratégias reais também podem considerar velocidade e outras informações do veículo.",
  ],
  [
    "Motor elétrico de assistência",
    "Fornece torque adicional por meio de uma redução. Representado em corte, com rotor e enrolamentos; não movimenta as rodas sozinho neste modelo.",
  ],
  [
    "Cremalheira / caixa EPS",
    "Converte a rotação em deslocamento lateral e recebe a assistência elétrica neste exemplo com motor junto à caixa.",
  ],
  ["Pinhão", "Recebe a rotação da coluna e atua sobre a cremalheira."],
  ["Barra axial", "Transmite deslocamento da cremalheira ao terminal."],
  [
    "Terminal de direção",
    "Articulação que conecta a barra ao conjunto da manga de eixo.",
  ],
  [
    "Semieixo",
    "Conduz torque às rodas e acompanha a articulação da suspensão. Não faz parte do acionamento elétrico da direção.",
  ],
  ["Bandeja", "Liga o agregado à suspensão e guia a posição da roda."],
  ["Pivô da bandeja", "Permite articulação entre bandeja e manga de eixo."],
  [
    "Agregado / subchassi",
    "Estrutura de apoio do módulo dianteiro e dos pontos de fixação.",
  ],
  [
    "Amortecedor e mola McPherson",
    "Conjunto que suporta cargas e controla movimentos da suspensão; inclui coxins neste modelo.",
  ],
  [
    "Disco de freio",
    "Superfície de atrito do freio. Permanece sem giro durante o esterçamento parado representado.",
  ],
  [
    "Pinça de freio",
    "Aplica as pastilhas ao disco e acompanha o esterçamento da roda.",
  ],
  [
    "Cubos e mangas (contexto)",
    "Apoiam o conjunto das rodas e recebem o comando dos terminais.",
  ],
  [
    "Estabilizadora e bieletas (contexto)",
    "Conjunto transversal da suspensão incluído para contextualizar o módulo dianteiro.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type EpsState = {
  explosion: number;
  steering: number;
  selected: number;
  automatic: boolean;
  assist: boolean;
  cutaway: boolean;
};
export const initialEpsState: EpsState = {
  explosion: 0,
  steering: 0,
  selected: 6,
  automatic: true,
  assist: true,
  cutaway: true,
};
