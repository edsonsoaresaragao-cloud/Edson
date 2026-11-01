export const coolingParts = [
  [
    "Radiador",
    "Transfere calor do líquido de arrefecimento para o ar externo através de tubos e aletas.",
  ],
  [
    "Eletroventilador / ventoinha",
    "Força ar através do radiador. O comando real depende de sensores, central e estratégia do veículo.",
  ],
  [
    "Tampa de pressão",
    "Controla a pressão prevista pelo projeto. Pode ficar no radiador ou no reservatório, conforme a aplicação; nunca é indicado abrir o sistema quente.",
  ],
  [
    "Bomba d’água",
    "O impulsor movimenta o líquido pelo motor e pelos circuitos disponíveis. Acionamento e geometria variam por motor.",
  ],
  [
    "Carcaça da válvula termostática",
    "Aloja o termostato e as conexões entre os caminhos de circulação.",
  ],
  [
    "Válvula termostática",
    "Modula a passagem para o radiador conforme a temperatura. A abertura aqui é manual e didática, sem temperatura nominal prescrita.",
  ],
  [
    "Mangueira superior",
    "Conduz líquido aquecido do conjunto do motor ao radiador quando o termostato permite a passagem.",
  ],
  [
    "Mangueira inferior",
    "Retorna líquido do radiador para a bomba neste exemplo. A cor azul indica menor temperatura relativa, não líquido gelado.",
  ],
  [
    "Reservatório de expansão",
    "Compensa variações de volume e permite observar o nível. Neste exemplo há linha de compensação; não se trata de um vaso pressurizado específico de fabricante.",
  ],
  [
    "Radiador do aquecedor",
    "Transfere calor do líquido do motor para o ar da cabine; não faz parte do circuito de refrigerante do ar-condicionado.",
  ],
  [
    "Mangueira de alimentação do aquecedor",
    "Leva líquido aquecido do motor ao trocador da cabine neste circuito ilustrativo.",
  ],
  [
    "Mangueira de retorno do aquecedor",
    "Retorna líquido do aquecedor para a entrada da bomba neste exemplo.",
  ],
  [
    "Ventilador da cabine / blower",
    "Impulsiona ar através do aquecedor. Esse ar não se mistura ao líquido que circula no trocador.",
  ],
  [
    "Dreno do radiador",
    "Ponto de esvaziamento quando existente no projeto. Não representa procedimento de manutenção.",
  ],
  [
    "Sensor de temperatura / ECT",
    "Informa a temperatura do líquido à eletrônica do veículo. Localização e características variam por aplicação.",
  ],
  [
    "Motor e desvio (contexto)",
    "Representação do percurso pelo motor e do bypass. Com o termostato fechado, a circulação interna pode continuar sem passar pelo radiador. A arquitetura de bypass varia por motor.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type CoolingState = {
  explosion: number;
  speed: number;
  selected: number;
  opening: number;
  fan: boolean;
};
export const initialCoolingState: CoolingState = {
  explosion: 0,
  speed: 0.6,
  selected: 6,
  opening: 1,
  fan: true,
};
export function coolingFlow(opening: number, speed: number) {
  const aperture = Math.min(1, Math.max(0, opening)),
    pump = Math.min(1, Math.max(0, speed));
  return {
    radiator: aperture * pump,
    bypass: (1 - aperture) * pump,
    heater: pump,
    engine: pump,
  };
}
