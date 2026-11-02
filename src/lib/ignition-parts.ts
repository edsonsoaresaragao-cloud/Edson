export const ignitionParts = [
  [
    "Chave de ignição codificada",
    "Chave mecânica com transponder. A lâmina é genérica e não representa segredo ou perfil de um veículo real.",
  ],
  [
    "Chip transponder",
    "Identificação eletrônica da chave. O transponder passivo deste exemplo é energizado pela antena leitora e não depende da pilha do controle remoto. Nenhum código real é mostrado.",
  ],
  [
    "Cilindro / comutador de ignição",
    "Recebe a chave e comanda posições de contato e partida. A animação mostra giro e retorno de START para ON.",
  ],
  [
    "Antena leitora do imobilizador",
    "Bobina ao redor do cilindro que permite a leitura do transponder por acoplamento de campo. As ondas são uma representação visual.",
  ],
  [
    "Imobilizador / BCM",
    "Representa a verificação de uma chave previamente cadastrada e a comunicação de autorização. Não há procedimento de cadastro ou programação de chaves.",
  ],
  [
    "ECU do motor",
    "Recebe o estado de autorização e comanda as funções de motor. A divisão entre BCM, ECU e partida depende da arquitetura do veículo.",
  ],
  [
    "Relé / fusível de partida",
    "Representa proteção e comando da alimentação do solenoide de partida. Os caminhos são esquemáticos, não um diagrama de ligação.",
  ],
  [
    "Motor de partida",
    "Aciona o motor térmico durante a tentativa autorizada. Após a representação de funcionamento, o pinhão recua e o motor de partida para.",
  ],
  [
    "Bobinas / injetores",
    "Comandos de ignição e injeção autorizados no exemplo. Os pulsos representam funcionamento, sem cálculo de combustível, tensão ou corrente.",
  ],
  [
    "Bateria (contexto)",
    "Fonte de alimentação do sistema. Não há simulação de carga, queda de tensão ou teste da bateria.",
  ],
  [
    "Motor e volante do motor (contexto)",
    "Conjunto simplificado para observar o acionamento pelo motor de partida e a continuidade do funcionamento após seu desacoplamento.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type IgnitionState = {
  explosion: number;
  selected: number;
  recognized: boolean;
};
export type IgnitionStep =
  | "insert"
  | "read"
  | "validate"
  | "authorize"
  | "crank"
  | "run"
  | "blocked"
  | "off";
export const ignitionStepLabels: Record<IgnitionStep, string> = {
  insert: "Inserção da chave",
  read: "Leitura pela antena",
  validate: "Verificação pelo imobilizador",
  authorize: "Autorização à ECU",
  crank: "Acionamento da partida",
  run: "Motor em funcionamento",
  blocked: "Chave não reconhecida neste cenário",
  off: "Contato desligado",
};
export const initialIgnitionState: IgnitionState = {
  explosion: 0,
  selected: 4,
  recognized: true,
};
export function ignitionSequence(time: number, recognized: boolean) {
  const t = ((time % 10) + 10) % 10;
  let step: IgnitionStep =
    t < 1
      ? "insert"
      : t < 2
        ? "read"
        : t < 3
          ? "validate"
          : t < 4
            ? "authorize"
            : t < 5.3
              ? "crank"
              : t < 9
                ? "run"
                : "off";
  if (!recognized && t >= 3 && t < 9) step = "blocked";
  const authorized = recognized && ["authorize", "crank", "run"].includes(step),
    starter = authorized && step === "crank",
    engine = authorized && step === "run";
  return {
    step,
    power: t >= 1 && t < 9,
    authorized,
    starter,
    engine,
    outputs: authorized && (starter || engine),
    keyAngle: t < 1 || t >= 9 ? 0 : t >= 4 && t < 5.3 ? 0.8 : 0.42,
    insertion: Math.min(1, t),
  };
}
