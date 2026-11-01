export const alternatorParts = [
  [
    "Polia",
    "Recebe o movimento da correia e o transmite ao rotor. A polia rígida deste exemplo não simula polias de roda livre.",
  ],
  [
    "Ventoinha frontal",
    "Gira com o eixo e promove circulação de ar para resfriar o alternador.",
  ],
  [
    "Rolamento dianteiro",
    "Apoia o eixo na carcaça dianteira e permite sua rotação com baixo atrito.",
  ],
  [
    "Carcaça dianteira",
    "Estrutura de alumínio ventilada, com alojamento do rolamento e pontos de fixação.",
  ],
  [
    "Rotor",
    "Conjunto girante de polos em garra e bobina de campo. Sua excitação cria o campo magnético.",
  ],
  [
    "Estator",
    "Núcleo laminado com enrolamentos fixos. O campo variável do rotor induz tensão alternada nas fases.",
  ],
  [
    "Regulador de tensão",
    "Controla a corrente de excitação para regular a tensão de saída. Valores e estratégia variam por veículo.",
  ],
  [
    "Porta-escovas",
    "Mantém as escovas em contato com os anéis coletores para alimentar o campo do rotor.",
  ],
  [
    "Ponte retificadora",
    "Diodos retificam a corrente alternada do estator para alimentar o circuito de corrente contínua.",
  ],
  [
    "Rolamento traseiro",
    "Apoia o eixo na parte traseira e mantém o alinhamento do rotor.",
  ],
  [
    "Carcaça traseira",
    "Sustenta o conjunto traseiro e os componentes elétricos, com aberturas de ventilação.",
  ],
  [
    "Terminais / conector",
    "Conectam saída de potência e sinais elétricos ao veículo; pinagem e comunicação variam por aplicação.",
  ],
  [
    "Parafusos passantes",
    "Unem as carcaças. O modelo não indica torque nem sequência de aperto.",
  ],
  [
    "Protetor traseiro",
    "Protege o retificador, regulador e conexões, preservando as passagens de ventilação.",
  ],
  [
    "Porca da polia",
    "Fixa a polia ao eixo. Torque, ferramenta e procedimento dependem do fabricante.",
  ],
  [
    "Espaçadores / isoladores",
    "Mantêm posição, afastamento e isolamento elétrico onde previsto pelo projeto.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type AlternatorState = {
  explosion: number;
  speed: number;
  selected: number;
  excited: boolean;
  cutaway: boolean;
};
export const initialAlternatorState: AlternatorState = {
  explosion: 0,
  speed: 0.5,
  selected: 5,
  excited: true,
  cutaway: true,
};
