import { engineMotion } from "./engine-motion";
export const copParts = [
  [
    "ECU do motor",
    "Processa sensores e comanda o instante de carga e interrupção da corrente primária das bobinas.",
  ],
  [
    "Bobinas individuais (COP)",
    "Uma bobina por cilindro neste exemplo. A bobina ampliada acima é uma cópia didática para estudar seu interior.",
  ],
  [
    "Velas de ignição",
    "A centelha ocorre no espaço entre os eletrodos, dentro da câmara de combustão.",
  ],
  [
    "Sensores do motor",
    "Representação de CKP, CMP, temperatura e carga. Os sinais são ilustrativos, sem valores medidos ou protocolo de diagnóstico.",
  ],
  [
    "Chicote e conectores",
    "Conecta alimentação, comando e sensores. Os caminhos representam funções, não pinagem ou ligações para manutenção.",
  ],
  [
    "Alimentação elétrica",
    "Bateria e fusível ilustram a alimentação nominal do sistema. Não há medição de tensão ou corrente.",
  ],
  [
    "Conector da bobina",
    "Interface elétrica da bobina ampliada. Quantidade e função dos pinos variam conforme a aplicação.",
  ],
  [
    "Carcaça da bobina",
    "Invólucro plástico da bobina ampliada, com janela de corte para visualizar o interior.",
  ],
  [
    "Driver eletrônico",
    "Representa o estágio que comuta a corrente primária. Pode estar integrado à bobina ou localizado em outro módulo conforme o sistema.",
  ],
  [
    "Núcleo magnético",
    "Concentra o fluxo magnético. Material e geometria variam conforme o projeto.",
  ],
  [
    "Enrolamento primário",
    "Armazena energia no campo magnético durante o período de carga. A interrupção de corrente permite a elevação de tensão no secundário.",
  ],
  [
    "Enrolamento secundário",
    "Fornece a tensão necessária à descarga na vela. Número de espiras e proporções da cena são apenas visuais.",
  ],
  [
    "Isolador e contato",
    "Borracha/silicone e contato de alta tensão ligam o conjunto à vela, mantendo o isolamento previsto pelo projeto.",
  ],
  [
    "Motor e referência de rotação (contexto)",
    "Corte simplificado de quatro cilindros e referência CKP para relacionar a centelha ao ciclo do motor.",
  ],
].map(([name, description], i) => ({ id: i + 1, name, description }));
export type CopState = {
  explosion: number;
  selected: number;
  running: boolean;
  cutaway: boolean;
};
export type CopEvent = {
  cylinder: number;
  phase: "charge" | "spark" | "wait" | "off";
};
export const initialCopState: CopState = {
  explosion: 0,
  selected: 11,
  running: true,
  cutaway: true,
};
export function copCycle(angle: number, running: boolean) {
  return Array.from({ length: 4 }, (_, i) => {
    const m = engineMotion(angle, i);
    return {
      motion: m,
      spark: running && m.stroke === 0 && m.progress < 0.06,
      charging: running && m.stroke === 3 && m.progress > 0.72,
    };
  });
}
