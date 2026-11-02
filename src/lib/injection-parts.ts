import { engineMotion } from "./engine-motion";
export const injectionParts = [
  [
    "Bomba de combustível",
    "Pressuriza e envia combustível do tanque. O conjunto está em corte para mostrar a bomba e o pescador.",
  ],
  [
    "Filtro de combustível",
    "Retém impurezas antes da distribuição aos injetores neste circuito.",
  ],
  [
    "Regulador de pressão",
    "Regula a pressão por retorno ligado à flauta neste exemplo MPI. A arquitetura varia por veículo.",
  ],
  ["Flauta / tubo distribuidor", "Distribui combustível aos quatro injetores."],
  [
    "Injetores (um por cilindro)",
    "Pulverizam combustível nos dutos de admissão, antes das válvulas. Não são injetores de injeção direta.",
  ],
  [
    "Medidor de fluxo de ar / MAF",
    "Mede o ar admitido. Caixa do filtro e duto também aparecem no conjunto.",
  ],
  [
    "Corpo de borboleta / TBI",
    "Controla a passagem de ar. Este exemplo usa borboleta mecânica com desvio de marcha lenta; outras aplicações usam borboleta eletrônica e podem dispensar IAC.",
  ],
  [
    "Sensor de temperatura do ar / IAT",
    "Informa a temperatura do ar admitido à ECU.",
  ],
  [
    "Atuador de marcha lenta / IAC",
    "Controla a passagem de ar pelo desvio neste exemplo de borboleta mecânica.",
  ],
  [
    "Sonda lambda",
    "Informa o teor de oxigênio nos gases de escape para o controle da mistura. Tubo e catalisador são contexto visual.",
  ],
  [
    "Unidade de comando / ECU",
    "Processa sensores e comanda injeção, ignição, bomba e purga. O modelo não reproduz um mapa de calibração real.",
  ],
  [
    "Válvula de purga do tanque / EVAP",
    "Controla a admissão dos vapores armazenados no cânister. Vapores e combustível líquido têm caminhos distintos.",
  ],
  [
    "Relé de comando",
    "Representa a alimentação da bomba e dos circuitos sob comando da ECU.",
  ],
  [
    "Bobinas de ignição",
    "Convertem energia elétrica em alta tensão para as velas. No exemplo há uma bobina por cilindro.",
  ],
  [
    "Velas de ignição",
    "Produzem a centelha na câmara de combustão, sem contato com os bicos de injeção no coletor.",
  ],
  [
    "Cânister",
    "Armazena vapores do tanque, posteriormente admitidos pelo comando de purga.",
  ],
  [
    "Coletor de admissão (contexto)",
    "Plenum e quatro dutos curvos distribuem o ar para o motor. Os injetores atuam nesses dutos.",
  ],
  [
    "Motor e cilindros (contexto)",
    "Corte simplificado de quatro cilindros para relacionar admissão e ignição. Movimento em câmera lenta e proporções didáticas.",
  ],
  [
    "Sensor de rotação / CKP (contexto)",
    "Representa a referência de rotação usada no sincronismo da ECU. Não há cálculo de dentes, diagnóstico ou sinal real.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type InjectionState = {
  explosion: number;
  throttle: number;
  selected: number;
  running: boolean;
};
export type InjectionPulse = { injector: number; spark: number };
export const initialInjectionState: InjectionState = {
  explosion: 0,
  throttle: 0.25,
  selected: 5,
  running: true,
};
export function injectionCycle(
  angle: number,
  throttle: number,
  running: boolean,
) {
  const opening = Math.min(1, Math.max(0, throttle));
  return Array.from({ length: 4 }, (_, i) => {
    const motion = engineMotion(angle, i);
    return {
      motion,
      injecting:
        running &&
        motion.stroke === 2 &&
        motion.progress >= 0.08 &&
        motion.progress < 0.2 + opening * 0.22,
      spark: running && motion.stroke === 0 && motion.progress < 0.07,
    };
  });
}
