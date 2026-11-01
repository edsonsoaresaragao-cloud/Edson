# Vídeos por data de publicação

A vitrine inicial passa a selecionar até 12 vídeos pela publicação original, com desempate por ID. Mostra seis inicialmente, com expansão local e filtros por assunto dentro dessa seleção; a biblioteca completa continua em `/videos`, com os filtros e paginação existentes. Busca e categorias também usam a ordem por publicação. Cartões da vitrine têm data original, duração, descrições limitadas a duas linhas, autoria e foco visível. Links promocionais são retirados apenas do resumo apresentado, preservando os dados de origem.

O campo `Content.publishedAt` separa publicação de importação (`createdAt`) e de agendamento editorial (`publishAt`). A migração recupera o timestamp original de `metadata.publishedAt` nos vídeos importados; para itens sem essa informação conserva `createdAt`. Importações seguintes escrevem o timestamp da API. A migração é executada pelo fluxo existente de inicialização do Render, e o build deve gerar o cliente Prisma atualizado.

O worker prioriza uma sincronização de novidades quando a última execução concluída desse tipo ultrapassa o intervalo configurado (padrão seis horas), mesmo com páginas antigas pendentes. O acervo continua em lotes com espaçamento de um minuto. A vitrine não inventa publicações recentes nem altera as fontes autorizadas: a atualização real depende dos vídeos existentes no canal, da chave válida, quota da API e worker ativo.

Validação: quatro testes puros/SSR para data, duração, resumo, links, filtros e prioridade das novidades; TypeScript direcionado ao componente e lint dos módulos modificados. O teste de integração YouTube/banco não executou porque o cliente Prisma não está gerado neste ambiente; migração e conferência visual em navegador não foram executadas aqui.
