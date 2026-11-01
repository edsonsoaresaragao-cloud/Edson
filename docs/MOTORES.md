# Atlas de motores

A rota `/explodedview` apresenta 31 famílias/versões agrupadas em nove fabricantes, com filtro de fabricante, busca sem distinção de acentos e seleção de motor e componente. A categoria `motor-e-componentes-internos`, já acessada pelo cartão Motor da homepage, contém o acesso ao atlas.

As vistas vetoriais são esquemas didáticos de arquitetura (I3, I4, I6 e V6); não representam a geometria específica de cada família. EcoBoost, Kappa e Smartstream aparecem como famílias de configuração variável; o esquema acompanha o recorte da versão de referência escolhido na pesquisa. As sete peças selecionáveis apresentam funções gerais, sem especificações, torques ou procedimentos inventados. A arte raster é conceitual e gerada por IA, identificada na página. Diagramas oficiais por código completo do motor podem substituir futuramente essas representações mediante fontes e direitos de uso apropriados.

O catálogo é estático, independente de chave YouTube, migração ou usuário administrador. A seleção é local à página. O tema acompanha o site e adapta a grade a dispositivos móveis.

Validação: `npx tsx --test tests/engines.test.tsx tests/core.test.ts`. Os testes cobrem famílias, IDs únicos, identificação de arquitetura, componentes, natureza ilustrativa e renderização da página. A checagem de tipos dos novos componentes foi feita isoladamente. O build integral não foi executado neste ambiente porque a geração do Prisma depende de um download bloqueado pela política de rede.

Publicação: enviar o código para main e iniciar no Render `Manual Deploy → Deploy latest commit` quando Auto-Deploy estiver desativado. Não altera variáveis de ambiente ou dados existentes.

## Imagens individuais e referências publicadas

Cada uma das 31 entradas agora possui uma ilustração explodida gerada individualmente em WebP e uma referência externa de imagem com procedência registrada em `src/lib/engine-visuals.json`. A página oferece as abas **Vista gerada**, **Referência** e **Esquema**, além de ampliação da vista. As miniaturas do catálogo usam a imagem individual do motor. Fotografias e imagens de divulgação externas ficam nos servidores originais; há fallback para o link da fonte caso o carregamento falhe.

As versões amplas possuem recorte explícito: EcoBoost 1.0, Kappa 1.0 MPI e Smartstream G2.0 CVVL, por exemplo. Esses recortes não representam todas as versões da família. A pesquisa e seus limites estão em `docs/REFERENCIAS-MOTORES.md`. As imagens geradas não são validadas como documentação de montagem e não são apresentadas como fotografias reais.
