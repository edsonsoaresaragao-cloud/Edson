/** Banco de correção no servidor. Não importar em componentes client. */
import { studySteps } from "./content";
export type StudyQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
function q(
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  explanation: string,
): StudyQuestion {
  return { id, prompt, options, correctIndex, explanation };
}
export const finalQuestions: StudyQuestion[] = [
  q(
    "final-1",
    "Qual a diferença entre motor interferente e não interferente?",
    [
      "Somente o tipo de combustível.",
      "A possibilidade de contato entre pistão e válvula em determinadas posições fora de sincronismo, conforme o projeto.",
      "Todo motor com corrente é não interferente.",
    ],
    1,
    "Interferência depende da geometria e das posições relativas. Um não interferente prevê folga nas condições do projeto; confirme sempre a aplicação.",
  ),
  q(
    "final-2",
    "O que pode acontecer se a correia dentada romper?",
    [
      "Perda de sincronismo e possível contato com danos, dependendo do projeto e das condições.",
      "Nada, desde que o motor seja desligado depois.",
      "Sempre apenas perda de potência, sem dano mecânico.",
    ],
    0,
    "A ruptura pode permitir colisão. Não acione o motor para descobrir se houve dano; verifique primeiro o sistema e a segurança da rotação.",
  ),
  q(
    "final-3",
    "Qual é a função do sincronismo entre comando e virabrequim?",
    [
      "Fazer ambos girarem sempre na mesma velocidade.",
      "Ajustar somente a pressão do óleo.",
      "Coordenar a abertura das válvulas com o movimento dos pistões; no quatro tempos convencional, a relação de rotação é 2:1.",
    ],
    2,
    "O comando completa uma volta para duas do virabrequim. A fase de montagem e as marcas específicas vêm do fabricante.",
  ),
  q(
    "final-4",
    "O que significa ‘sem fonte — trate como interferente’?",
    [
      "Há prova de que todas as versões colidem.",
      "Falta confirmação confiável; adote o procedimento conservador até confirmar a aplicação.",
      "O motor é comprovadamente não interferente.",
    ],
    1,
    "A legenda expressa incerteza. Não converta ausência de documentação em confirmação de uma das duas geometrias.",
  ),
  q(
    "final-5",
    "Por que verificar o código exato do motor?",
    [
      "Porque ano, versão e configuração podem exigir classificações, ferramentas e procedimentos diferentes.",
      "Porque a marca do veículo nunca importa.",
      "Porque todos os motores da mesma cilindrada são idênticos.",
    ],
    0,
    "Código, ano, aplicação e configuração delimitam a documentação correta; o nome da família sozinho pode ser insuficiente.",
  ),
  q(
    "final-6",
    "Uma corrente elimina falhas de sincronismo?",
    [
      "Sim, não precisa de inspeção.",
      "Sim, desde que não tenha correia auxiliar.",
      "Não. Corrente, guias, tensionadores e montagem também podem apresentar falhas.",
    ],
    2,
    "Tipo de acionamento não é garantia contra perda de fase nem comprovação de não interferência.",
  ),
  q(
    "final-7",
    "Qual é a função do tensionador da distribuição?",
    [
      "Aumentar a compressão dos cilindros.",
      "Manter as condições de tensão previstas no sistema; seu ajuste e verificação dependem do projeto.",
      "Substituir as marcas e ferramentas de sincronismo.",
    ],
    1,
    "Tensionamento inadequado pode comprometer o sincronismo. Siga o procedimento e investigue componentes associados.",
  ),
  q(
    "final-8",
    "Por que não girar eixos fora de ponto sem avaliação?",
    [
      "Pode haver contato entre válvulas e pistões; mesmo à mão, não se deve forçar resistência.",
      "Porque somente o motor de partida pode mover esses eixos com segurança.",
      "Porque a corrente impede qualquer movimento manual.",
    ],
    0,
    "A posição segura precisa ser estabelecida antes de qualquer rotação. O arranque nunca é o primeiro teste quando há suspeita de colisão.",
  ),
  q(
    "final-9",
    "Quais exames podem contribuir para investigar válvulas danificadas?",
    [
      "Somente a leitura de um código de falha.",
      "Apenas escutar o arranque repetidamente.",
      "Histórico, inspeção da distribuição e boroscopia; compressão e estanqueidade apenas quando seguros e aplicáveis, com possível inspeção do cabeçote.",
    ],
    2,
    "Combine evidências. Uma baixa compressão ou fuga não comprova, isoladamente, empenamento. Defina critérios e condições pelo manual.",
  ),
  q(
    "final-10",
    "O que verificar antes de liberar o reparo?",
    [
      "Somente se o motor pegou.",
      "Identificação, causa corrigida, sincronismo, componentes, medições e validações seguras segundo a documentação do fabricante.",
      "Apenas apagar os códigos de falha.",
    ],
    1,
    "Documente diagnóstico, correção e conferências da aplicação. Não libere o veículo apenas pela ausência momentânea de um sintoma.",
  ),
];
const practice: Record<string, StudyQuestion> = {
  volkswagen: q(
    "vw-1",
    "O que a marcação ‘sem fonte’ nas onze linhas Volkswagen permite concluir?",
    [
      "Nenhum AP entorta válvula.",
      "A classificação não foi confirmada pela referência; é necessário cuidado conservador e confirmação da aplicação.",
      "Toda versão de EA211 tem a mesma geometria.",
    ],
    1,
    "A página 2 não comprova não interferência dessas linhas. Reputação e família não substituem documentação específica.",
  ),
  chevrolet: q(
    "gm-1",
    "Qual cuidado corresponde ao alerta da Família I 1.8 8V?",
    [
      "Investigar o risco de contato após falha na correia, sem usar a partida como teste inicial.",
      "Aplicar a classificação a todo Ecotec.",
      "Ignorar uma alteração de um dente.",
    ],
    0,
    "O alerta é dessa linha e descreve contato na ruptura. As demais linhas precisam de interpretação própria e confirmação da aplicação.",
  ),
  "fiat-jeep": q(
    "fiat-1",
    "A indicação de interferência do Fire 1.0 8V deve ser usada como?",
    [
      "Prova de que todo Fire e Firefly tem a mesma configuração.",
      "Prova de que corrente impede contato.",
      "Alerta dessa linha; as demais mantêm suas classificações e precisam de confirmação por código.",
    ],
    2,
    "A página 4 distingue Fire 1.0 8V das linhas sem fonte. Correia e corrente não definem sozinhas a geometria.",
  ),
  ford: q(
    "ford-1",
    "Como interpretar a dica original de girar duas voltas à mão?",
    [
      "É autorização para forçar qualquer motor travado.",
      "A página é preservada, mas primeiro é preciso confirmar a segurança pelo procedimento; não gire ou force um conjunto com suspeita de contato.",
      "Use o motor de partida no lugar da ferramenta manual.",
    ],
    1,
    "Uma dica genérica não prevalece sobre o risco de colisão e o procedimento específico. Resistência exige parar e investigar.",
  ),
  "renault-nissan": q(
    "rn-1",
    "Uma corrente montada fora de fase pode permitir colisão?",
    [
      "Sim; ter corrente não dispensa identificação, marcas, ferramentas e avaliação de risco.",
      "Não, a corrente corrige a fase sozinha.",
      "Somente se o veículo tiver transmissão automática.",
    ],
    0,
    "A dica da página 6 alerta para montagem um dente fora. As classificações sem fonte permanecem sem confirmação.",
  ),
  "peugeot-citroen": q(
    "psa-1",
    "Quais linhas são destacadas como interferentes na página Peugeot/Citroën?",
    [
      "Todos os motores PureTech de qualquer ano.",
      "Somente DW10 e 2.2 HDi.",
      "TU5 1.6 16V e EC5 1.6 16V, respeitando a aplicação e as fontes citadas.",
    ],
    2,
    "As duas linhas são destacadas na fonte. As outras mantêm a indicação sem fonte; não generalize por fabricante.",
  ),
  toyota: q(
    "toyota-1",
    "A ausência de um motor Toyota na lista citada comprova não interferência?",
    [
      "Sim, a ausência basta.",
      "Não. Ausência de evidência não confirma folga; use a documentação da aplicação e cuidado conservador.",
      "Sim, se for Corolla.",
    ],
    1,
    "A própria nota da página 8 rejeita essa conclusão. Preserve a classificação de incerteza.",
  ),
  honda: q(
    "honda-1",
    "A nota sobre Civic 1.6 (1988–89) confirma automaticamente todos os D16 de todos os anos?",
    [
      "Não. A citação tem aplicação delimitada; outras versões precisam de confirmação própria.",
      "Sim, o nome da família garante a mesma configuração.",
      "Sim, inclusive todos os motores D17 e K20.",
    ],
    0,
    "A linha e a nota precisam ser lidas juntas. A aula não amplia o alcance da referência citada.",
  ),
  "hyundai-kia": q(
    "hk-1",
    "O alerta do Beta 2.0 G4GC do Tucson confirma a classificação de todo Kappa ou Gamma?",
    [
      "Sim, todos são iguais.",
      "Sim, porque todo Hyundai usa correia seca.",
      "Não; cada linha mantém seu tipo de acionamento e sua classificação na fonte.",
    ],
    2,
    "O alerta é específico. As outras linhas da página 10 ficam sem fonte de interferência, exigindo confirmação da aplicação.",
  ),
  mitsubishi: q(
    "mitsubishi-1",
    "Como tratar as linhas 4D56 e 4M41 na referência?",
    [
      "Como comprovadamente não interferentes.",
      "Conservar a indicação sem fonte e adotar precaução até confirmar aplicação e procedimento.",
      "Como idênticas ao 4G63 de qualquer país.",
    ],
    1,
    "A fonte não confirma a classificação dessas linhas. As referências americanas de 4G63/4G64 não podem ser estendidas a elas.",
  ),
};
export function questionsFor(step: string): StudyQuestion[] {
  if (step === "avaliacao") return finalQuestions;
  return practice[step] ? [practice[step]] : [];
}
export function publicQuestions(step: string) {
  return questionsFor(step).map(({ id, prompt, options }) => ({
    id,
    prompt,
    options,
  }));
}
export function gradeStep(step: string, answers: Record<string, number>) {
  if (!studySteps.some((s) => s.id === step))
    throw new Error("Etapa inválida.");
  const questions = questionsFor(step);
  if (Object.keys(answers).some((id) => !questions.some((q) => q.id === id)))
    throw new Error("Resposta não pertence à etapa.");
  if (
    questions.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id] < 0 ||
        answers[q.id] >= q.options.length,
    )
  )
    throw new Error("Responda a todas as perguntas.");
  const correct = questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  return {
    score: questions.length
      ? Math.round((100 * correct) / questions.length)
      : 100,
    feedback: questions.map((q) => ({
      id: q.id,
      correct: answers[q.id] === q.correctIndex,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  };
}
