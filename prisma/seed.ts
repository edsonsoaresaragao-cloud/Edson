import "dotenv/config";
import { db } from "../src/lib/db";
import { categoryNames, slugify } from "../src/lib/catalog";
async function main() {
  for (const name of categoryNames)
    await db.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        description: `Conteúdos educativos sobre ${name.toLowerCase()}: funcionamento, inspeções e manutenção. Consulte sempre as especificações do fabricante.`,
      },
    });
  // Editorial original, never attributed to third-party videos or a vehicle application.
  const entries = [
    {
      kind: "PART",
      title: "Bateria automotiva",
      summary: "Reserva de energia para a partida e os sistemas elétricos.",
      body: "Função: fornecer energia à partida e estabilizar a alimentação elétrica.\nFuncionamento: armazena energia química e a disponibiliza como corrente contínua.\nLocalização comum: compartimento do motor ou alojamento indicado pelo fabricante.\nSintomas possíveis: partida lenta, dificuldade para ligar e falhas elétricas. Esses sinais também podem ter outras causas.\nManutenção: inspecionar fixação, terminais e estado de carga com instrumentos adequados. Evite curtos e contato com eletrólito.\nAplicações: confirme tensão, capacidade, dimensões e tecnologia no manual do veículo; nenhuma compatibilidade específica é presumida.",
      categorySlugs: ["bateria"],
    },
    {
      kind: "PART",
      title: "Sensor de pressão do coletor (MAP)",
      summary: "Informa a pressão do coletor ao gerenciamento eletrônico.",
      body: "A central utiliza o sinal de pressão juntamente com outros dados para controlar o motor. Falhas de alimentação, chicote, vedação ou do próprio sensor podem afetar a leitura. Consulte o diagrama e os valores específicos do fabricante antes de testar ou substituir. Localização e aplicação variam conforme o projeto.",
      categorySlugs: ["injecao-eletronica", "sensores-e-atuadores"],
    },
    {
      kind: "PART",
      title: "Pastilhas de freio",
      summary: "Elementos de atrito do sistema de freios a disco.",
      body: "Transformam energia cinética em calor por atrito com o disco. Ruídos e perda de eficiência exigem inspeção profissional do conjunto. Não há aplicação universal: confirme código, dimensões e especificação do fabricante. Serviços em freios requerem profissional qualificado.",
      categorySlugs: ["freios-e-abs"],
    },
    {
      kind: "DIAGNOSIS",
      title: "Motor não liga",
      summary:
        "Possibilidades educativas: bateria, partida, alimentação e ignição.",
      body: "Observe se o motor de partida gira. Verifique alertas do painel e consulte o manual. Uma bateria descarregada é uma possibilidade, não uma conclusão. Conexões, imobilizador, motor de partida, combustível e ignição também podem estar envolvidos.\nNão faça pontes improvisadas, não acesse componentes de alta tensão e não substitua peças sem testes. Se houver cheiro de combustível, fumaça ou aquecimento anormal, interrompa a tentativa e procure assistência qualificada.",
      categorySlugs: ["bateria", "motor-de-partida", "ignicao"],
    },
    {
      kind: "DIAGNOSIS",
      title: "P0300 — Falhas de combustão aleatórias",
      summary:
        "Código genérico OBD-II de falhas de combustão aleatórias ou múltiplas.",
      body: "O código registra uma condição detectada; não identifica sozinho a peça responsável. Possibilidades incluem ignição, alimentação, entrada de ar e condições mecânicas. Registre os códigos e o quadro congelado antes de qualquer intervenção. Se a luz de injeção piscar ou houver forte falha de funcionamento, interrompa a condução com segurança e procure diagnóstico profissional.",
      categorySlugs: ["injecao-eletronica", "ignicao"],
    },
    {
      kind: "GUIDE",
      title: "Planeje a manutenção preventiva",
      summary:
        "Histórico e informações do fabricante ajudam a evitar intervenções desnecessárias.",
      body: "Consulte o plano de manutenção do veículo, registre data e quilometragem e mantenha comprovantes. Intervalos dependem do fabricante e das condições de uso. Nunca adote um intervalo genérico como especificação para todos os veículos.",
      categorySlugs: ["manutencao-preventiva"],
    },
    {
      kind: "ARTICLE",
      title: "Organização técnica para oficinas e frotas",
      summary:
        "Registros claros melhoram a continuidade do atendimento e da manutenção.",
      body: "Registre a queixa relatada, as condições em que ocorre, inspeções realizadas e o resultado de cada teste. Diferencie hipótese de defeito confirmado. Para frotas, associe cada intervenção à identificação do veículo e mantenha rastreabilidade das peças utilizadas.",
      categorySlugs: [
        "gestao-de-oficinas",
        "manutencao-e-produtividade-de-frotas",
      ],
    },
  ];
  for (const e of entries)
    await db.content.upsert({
      where: { slug: slugify(e.title) },
      update: {},
      create: {
        ...e,
        slug: slugify(e.title),
        status: "PUBLISHED",
        author: "EDSON OFICINA",
      },
    });
  console.log(
    "34 categorias e 7 conteúdos educativos originais preparados. Nenhum vídeo, curso ou aluno fictício publicado.",
  );
}
main().finally(() => db.$disconnect());
