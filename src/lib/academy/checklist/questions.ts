/** Correção somente no servidor; a sala de estudo recebe publicQuestions(). */
import type { StudyQuestion } from "../questions";
import { StudyError } from "../progress";
import { steps } from "./content";
const q = (
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  explanation: string,
): StudyQuestion => ({ id, prompt, options, correctIndex, explanation });
const practice: Record<string, StudyQuestion[]> = {
  "correia-seca": [
    q(
      "seca-1",
      "O motor apresenta resistência inesperada durante a conferência manual. Como interpretar a fonte?",
      [
        "Forçar até completar as voltas.",
        "Interromper, não forçar e investigar segundo o procedimento do motor.",
        "Usar o arranque para vencer a resistência.",
      ],
      1,
      "A fonte alerta para possível contato entre válvula e pistão. A rotação só é considerada depois de estabelecer condições seguras pelo manual; resistência não autoriza usar mais força.",
    ),
    q(
      "seca-2",
      "O que deve acontecer com o ponteiro do tensor após as voltas previstas?",
      [
        "Permanecer na marca da instrução do kit, nas condições previstas.",
        "Pode sair da marca se o motor funcionar.",
        "A marca deixa de importar após montar as tampas.",
      ],
      0,
      "O checklist pede a marca da instrução do kit, com motor frio, e sua permanência após as voltas. Confirme a aplicação exata e o procedimento correspondente.",
    ),
  ],
  "correia-em-oleo": [
    q(
      "oleo-1",
      "Qual conjunto de cuidados aparece em Óleo e tampa?",
      [
        "Apenas completar com qualquer óleo.",
        "Somente limpar a parte externa do motor.",
        "Óleo especificado, filtro e nível, pescador limpo, tampa e cura conforme a instrução.",
      ],
      2,
      "O material relaciona óleo da especificação, filtro novo, nível correto, tampa inferior nova, cura e pescador sem restos da correia. A especificação e o tempo aplicáveis vêm da documentação do motor.",
    ),
    q(
      "oleo-2",
      "A luz do óleo permanece acesa ou surge ruído na primeira partida. O que a referência determina?",
      [
        "Aguardar sem interromper para observar.",
        "Desligar na hora e investigar conforme o procedimento.",
        "Acelerar para apagar a luz.",
      ],
      1,
      "A página orienta desligar na hora. Não use partidas repetidas ou aceleração para tentar eliminar uma indicação de problema de lubrificação.",
    ),
  ],
  corrente: [
    q(
      "corrente-1",
      "Após as voltas, o elo colorido não voltou à posição inicial. Qual é a leitura correta da página?",
      [
        "É necessário conferir marcas das engrenagens e ferramentas conforme o manual; o elo não voltar pode ser normal.",
        "Sempre significa que pulou um dente.",
        "Basta o elo colorido para dispensar as outras marcas.",
      ],
      0,
      "A fonte distingue elos coloridos na montagem e marcas das engrenagens/ferramentas na conferência. Não generalize ciclos ou posições; confirme a aplicação exata.",
    ),
    q(
      "corrente-2",
      "Qual condição do tensor hidráulico consta do checklist?",
      [
        "Pino mantido instalado para a partida.",
        "Tensor travado sem apoiar a guia.",
        "Pino/trava retirado, tensor liberado e empurrando a guia, conforme a aplicação.",
      ],
      2,
      "A página inclui a retirada do pino/trava e a ação do tensor sobre a guia. A sequência de liberação e conferência depende do projeto e do manual.",
    ),
  ],
};
export const finalQuestions = [
  q(
    "final-1",
    "O checklist geral substitui a documentação do motor?",
    [
      "Não. Código, ano, versão, ferramentas e procedimentos devem ser confirmados no manual correspondente.",
      "Sim, para qualquer motor da mesma marca.",
      "Sim, desde que o motor tenha quatro cilindros.",
    ],
    0,
    "O próprio rodapé manda conferir no modelo. Não foram fornecidos torques, ângulos ou tempos universais.",
  ),
  q(
    "final-2",
    "Qual atitude corresponde a um travamento ou resistência inesperada?",
    [
      "Completar o giro com mais força.",
      "Interromper e investigar sem forçar nem usar a partida como teste.",
      "Girar comando e virabrequim separadamente sem verificar posições.",
    ],
    1,
    "As três páginas destacam a interrupção diante de travamento. A segurança da rotação precisa ser estabelecida antes da conferência.",
  ),
  q(
    "final-3",
    "Na correia seca, qual condição das marcas aparece na fonte?",
    [
      "Somente as marcas de tinta feitas durante a desmontagem.",
      "Marcas dispensáveis quando a correia é nova.",
      "Comando e virabrequim alinhados com as referências da tampa/cabeçote, conforme a aplicação.",
    ],
    2,
    "A página exige alinhamento e orienta refazer se houver dente fora. As referências e ferramentas corretas vêm do fabricante.",
  ),
  q(
    "final-4",
    "Na correia seca, o que é conferido em Periféricos?",
    [
      "Tampas sem raspar, correia de acessórios, conectores e sensor de rotação no lugar.",
      "Somente a tampa decorativa.",
      "Apenas o nível do reservatório do limpador.",
    ],
    0,
    "São os periféricos listados na página 2. Estudar esse item não substitui verificar todos os componentes previstos no reparo específico.",
  ),
  q(
    "final-5",
    "Que cuidado aparece para polias sem chaveta na correia em óleo?",
    [
      "Apertar sempre com o motor solto.",
      "Conferir o aperto com o bloqueio correto do motor, segundo o procedimento específico.",
      "Dispensar as ferramentas dos comandos.",
    ],
    1,
    "A fonte alerta que apertar com o motor solto pode deixar o comando fora de fase. Ferramentas, sequência e valores precisam ser os da aplicação.",
  ),
  q(
    "final-6",
    "Como interpretar a indicação de óleo da especificação?",
    [
      "Todos os motores usam a mesma viscosidade.",
      "A foto da embalagem define qualquer aplicação.",
      "Confirmar homologação/especificação, filtro e nível no manual do motor exato.",
    ],
    2,
    "A página não estabelece uma especificação universal de óleo. Uma fotografia não fornece a homologação da aplicação.",
  ),
  q(
    "final-7",
    "Quais referências distinguem montagem e conferência na corrente?",
    [
      "Elos coloridos quando presentes na montagem; marcas das engrenagens e ferramentas na conferência após o giro.",
      "Somente a cor do óleo.",
      "A posição dos elos deve sempre repetir após duas voltas em qualquer corrente.",
    ],
    0,
    "A página distingue essas referências e informa que o elo colorido não voltar pode ser normal. Verifique a aplicação pelo manual.",
  ),
  q(
    "final-8",
    "O que a fonte pede em Tampa e óleo para corrente?",
    [
      "Qualquer vedante, sem aguardar instruções.",
      "Vedação e cura, óleo/filtro/nível e retentor dianteiro novo sem dobrar o lábio.",
      "Somente repor óleo se houver ruído.",
    ],
    1,
    "Os três cuidados estão no sexto ponto da página 4. Materiais e tempo de cura precisam seguir as instruções aplicáveis.",
  ),
  q(
    "final-9",
    "De onde vêm os valores de torque, ângulo e a decisão sobre fixadores?",
    [
      "Do tamanho aparente da ferramenta da foto.",
      "De um valor único adotado para toda a oficina.",
      "Da documentação e do procedimento da aplicação exata, considerando as instruções sobre fixadores.",
    ],
    2,
    "O material menciona torque e ângulo do guia, sem fornecer números universais. Não invente valores a partir das fotografias.",
  ),
  q(
    "final-10",
    "Ruído persistente de corrente ou luz de injeção após a partida deve levar a quê?",
    [
      "Desligar e conferir conforme o checklist e o procedimento do fabricante.",
      "Acelerar até o ruído desaparecer.",
      "Repetir partidas sem investigar a montagem.",
    ],
    0,
    "A página 4 determina desligar e conferir. Não interprete uma indicação persistente como funcionamento normal.",
  ),
];
export function questionsFor(step: string) {
  if (!steps.some((s) => s.id === step))
    throw new StudyError("Etapa inválida.");
  return step === "avaliacao" ? finalQuestions : practice[step] || [];
}
export function publicQuestions(step: string) {
  return questionsFor(step).map(({ id, prompt, options }) => ({
    id,
    prompt,
    options,
  }));
}
export function gradeStep(step: string, answers: Record<string, number>) {
  const questions = questionsFor(step);
  if (Object.keys(answers).some((id) => !questions.some((q) => q.id === id)))
    throw new StudyError("Resposta não pertence à etapa.");
  if (
    questions.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id] < 0 ||
        answers[q.id] >= q.options.length,
    )
  )
    throw new StudyError("Responda a todas as perguntas.");
  const feedback = questions.map((q) => ({
    id: q.id,
    correct: answers[q.id] === q.correctIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
  return {
    score: questions.length
      ? Math.round(
          (100 * feedback.filter((f) => f.correct).length) / questions.length,
        )
      : 100,
    feedback,
  };
}
