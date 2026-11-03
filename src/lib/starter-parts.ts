export const starterParts = [
  {
    id: 1,
    name: "Carcaça dianteira",
    description:
      "Suporta o conjunto, mantém o alinhamento do eixo e posiciona o pinhão em relação à coroa do volante.",
    inspection:
      "Fixações, trincas, bucha de apoio e alinhamento conforme o fabricante.",
  },
  {
    id: 2,
    name: "Pinhão (Bendix)",
    description:
      "Engrena na coroa do volante e transmite o movimento de partida. Bendix é um nome usual do conjunto de acionamento; aqui o pinhão e a roda livre são identificados separadamente.",
    inspection: "Desgaste dos dentes, movimento axial e danos de engrenamento.",
  },
  {
    id: 3,
    name: "Embreagem de roda livre",
    description:
      "Transmite o torque do induzido ao pinhão durante a partida e permite sobrevelocidade do pinhão quando o motor térmico entra em funcionamento.",
    inspection:
      "Travamento no sentido de transmissão e giro livre no sentido previsto para o conjunto.",
  },
  {
    id: 4,
    name: "Garfo de acionamento",
    description:
      "Converte o movimento do êmbolo do solenoide em deslocamento axial do conjunto de pinhão e roda livre.",
    inspection:
      "Desgaste dos apoios, articulação e encaixe no conjunto de acionamento.",
  },
  {
    id: 5,
    name: "Solenoide (automático)",
    description:
      "Movimenta o garfo e fecha os contatos de potência que alimentam o motor elétrico. Recebe o comando de partida pelo circuito de controle.",
    inspection:
      "Tensão de comando, movimento do êmbolo, contatos e queda de tensão conforme o procedimento da aplicação.",
  },
  {
    id: 6,
    name: "Carcaça do motor",
    description:
      "Abriga e sustenta o estator e o induzido. No exemplo, é um corpo cilíndrico de aço com fixações passantes.",
    inspection:
      "Integridade, fixação e condições dos pontos de massa e isolamento previstos no projeto.",
  },
  {
    id: 7,
    name: "Induzido (rotor)",
    description:
      "Conjunto girante com eixo, núcleo laminado, enrolamentos de cobre e coletor segmentado. A interação com o campo do estator produz torque.",
    inspection:
      "Coletor, enrolamentos, isolamento, eixo e folgas de apoio com instrumentos adequados.",
  },
  {
    id: 8,
    name: "Estator (campo / eletroímã)",
    description:
      "Produz o campo magnético que interage com o induzido. O modelo usa polos com bobinas de campo; outros arranques podem empregar ímãs permanentes.",
    inspection:
      "Bobinas, conexões, isolamento e fixação dos polos conforme o tipo de motor.",
  },
  {
    id: 9,
    name: "Porta-escovas",
    description:
      "Sustenta e guia as escovas, mantendo seu posicionamento e a pressão das molas sobre o coletor do induzido.",
    inspection: "Guias, molas, isolamento e livre movimento das escovas.",
  },
  {
    id: 10,
    name: "Escovas de carvão",
    description:
      "Conduzem corrente elétrica para o coletor do induzido por contato deslizante. Permanecem fixas enquanto o rotor gira.",
    inspection:
      "Comprimento, pressão de contato, desgaste e cordoalhas. O limite mínimo é específico de cada motor.",
  },
  {
    id: 11,
    name: "Tampa traseira",
    description:
      "Fecha o conjunto e abriga o apoio traseiro do eixo. A fixação do porta-escovas depende da construção do arranque.",
    inspection:
      "Bucha ou rolamento, vedação, fixações e alinhamento do conjunto.",
  },
] as const;

export const starterStages = [
  {
    id: "command",
    name: "Comando e avanço",
    part: 5,
    description:
      "O comando START energiza o solenoide; o êmbolo movimenta o garfo e leva o pinhão em direção à coroa.",
  },
  {
    id: "engage",
    name: "Engrenamento e contato",
    part: 2,
    description:
      "O pinhão completa o avanço e os contatos de potência fecham. O acionamento real depende da construção do solenoide e do estado do engrenamento.",
  },
  {
    id: "crank",
    name: "Motor em partida",
    part: 7,
    description:
      "Com o circuito de potência fechado, o campo e o induzido produzem torque. O pinhão gira e movimenta a coroa do volante.",
  },
  {
    id: "overrun",
    name: "Motor pega / roda livre",
    part: 3,
    description:
      "O motor térmico passa a arrastar o pinhão mais rápido. A roda livre evita transmitir essa sobrevelocidade ao induzido; o comando elétrico é liberado neste exemplo.",
  },
  {
    id: "return",
    name: "Retorno do pinhão",
    part: 4,
    description:
      "Sem comando, os contatos permanecem abertos e o mecanismo retorna. O motor térmico continua funcionando, com o pinhão fora da coroa.",
  },
] as const;

export type StarterState = {
  explosion: number;
  selected: number;
  speed: number;
  cutaway: boolean;
  isolate: boolean;
  context: boolean;
};
export const initialStarterState: StarterState = {
  explosion: 1,
  selected: 7,
  speed: 0.6,
  cutaway: true,
  isolate: false,
  context: true,
};
export const STARTER_STAGE_SECONDS = 2.6;
export function starterSequence(time: number) {
  const t = ((time % 13) + 13) % 13;
  const stage = Math.min(4, Math.floor(t / STARTER_STAGE_SECONDS));
  const progress = (t - stage * STARTER_STAGE_SECONDS) / STARTER_STAGE_SECONDS;
  const smooth = (value: number) => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  };
  const travel =
    stage === 0
      ? smooth(progress)
      : stage === 4
        ? 1 - smooth(progress * 1.8)
        : 1;
  const contact = stage === 2 || (stage === 1 && progress > 0.45);
  return {
    stage,
    progress,
    travel,
    contact,
    command: stage < 3,
    motor: contact,
    overrun: stage === 3,
    engine: stage >= 3,
    engaged: travel > 0.96,
  };
}

export const starterFaults = [
  [
    "Escovas gastas ou sem contato",
    "Pode não dar partida ou girar fraco.",
    "Inspecionar escovas, molas, coletor e alimentação; o sintoma também pode ter outras causas.",
  ],
  [
    "Solenoide ou circuito de comando com falha",
    "Pode não acionar ou apenas produzir estalo.",
    "Distinguir ausência de comando, êmbolo travado e contatos de potência deteriorados.",
  ],
  [
    "Pinhão / roda livre com defeito",
    "Pode girar sem movimentar o motor, estalar ou falhar no engrenamento.",
    "Conferir mecanismo de acionamento e dentes da coroa do volante.",
  ],
  [
    "Enrolamento aberto ou em curto",
    "Pode girar muito fraco ou não girar.",
    "Verificar alimentação, corrente e integridade elétrica conforme o manual.",
  ],
  [
    "Cabos ou aterramentos com mau contato",
    "Partida intermitente ou sem força.",
    "Medir quedas de tensão sob carga e conferir conexões e aterramentos.",
  ],
] as const;
