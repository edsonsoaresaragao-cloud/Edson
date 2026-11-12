# Pesquisa técnica automotiva

A pesquisa reúne informações técnicas e ofertas em `/pecas`. Veja também a [arquitetura do buscador com oito abas](./BUSCADOR-AUTOMOTIVO-INTELIGENTE.md). O endereço `/pesquisa-automotiva` também abre o mesmo componente. A busca de ofertas, seus parâmetros `buy` e a biblioteca técnica foram preservados. A pesquisa técnica usa os parâmetros `auto` e `auto_*`, que permitem compartilhar uma consulta completa.

## Ativação no Render

1. Configure uma API de busca autorizada no serviço do portal:
   - Google Programmable Search: `AUTOMOTIVE_GOOGLE_API_KEY` e `AUTOMOTIVE_GOOGLE_CX` (ID do mecanismo). O mecanismo precisa pesquisar os sites desejados e permitir imagens.
   - Ou Brave Search: `AUTOMOTIVE_BRAVE_API_KEY`. Por compatibilidade também aceita `BRAVE_SEARCH_API_KEY` ou `PARTS_BRAVE_API_KEY` já configurada. A assinatura precisa autorizar os endpoints web e imagens.
2. Para vídeos, configure `YOUTUBE_API_KEY`, com YouTube Data API v3 habilitada. Usa a API oficial de pesquisa; a presença do vídeo nos resultados não implica afiliação ou endosso do canal.
3. Para síntese, configure `OPENAI_API_KEY`. O modelo padrão é `gpt-4.1-mini`; altere `AUTOMOTIVE_AI_MODEL` apenas para um modelo compatível com Chat Completions e JSON Schema estrito. Sem essa chave, os resultados e suas fontes continuam disponíveis.
4. Use o banco PostgreSQL existente (`DATABASE_URL`). A migração `202611120001_automotive_search` adiciona apenas cache e histórico com vínculo ao usuário. A inicialização do Render já executa `prisma migrate deploy`; não use reset nem recrie o banco.
5. No Render, execute **Manual Deploy → Deploy latest commit**, pois o Auto Deploy deste projeto está desativado. Confira a migração nos logs e faça uma consulta em `/pecas` após a publicação.

Chaves ficam exclusivamente no servidor. Não use variáveis `NEXT_PUBLIC_`, não envie chaves pelo chat e não inclua arquivos `.env` no Git. Habilitação comercial, elegibilidade e preços dependem de cada provedor; consulte sua conta antes da ativação.

## Consultas, limites e falhas

- Google e Brave, quando habilitados juntos, fazem até quatro chamadas por pesquisa (web e imagens de cada um). YouTube acrescenta uma chamada. A IA recebe somente resultados web retornados; não é acionada sem evidência externa.
- Limites compartilhados em PostgreSQL: `AUTOMOTIVE_WEB_DAILY_LIMIT=60`, `AUTOMOTIVE_WEB_MONTHLY_LIMIT=500`, `AUTOMOTIVE_AI_DAILY_LIMIT=20`, `AUTOMOTIVE_YOUTUBE_DAILY_SEARCHES=5`. Cada endpoint web/imagem consome uma chamada. Uma pesquisa YouTube custa normalmente 100 unidades da cota do Google; o orçamento aqui conta pesquisas, não unidades. A sincronização de vídeos existente tem orçamento separado e compartilha a cota real da mesma chave.
- Cache padrão: `AUTOMOTIVE_CACHE_SECONDS=900`, ajustável entre 60 e 3600 segundos. Cache em PostgreSQL, com reserva limitada em memória e coalescência por processo. Consultas servidas pelo cache não consomem chamadas de API. Se o banco falhar, a reserva de cota falha de forma fechada; nenhuma chamada paga nova é feita.
- Há limite compartilhado de 30 requisições por minuto quando existem integrações configuradas, além de proteção local de 90. Sugestões são calculadas localmente e não fazem chamadas pagas.
- Falhas parciais preservam resultados das outras fontes. Sem configuração, a interface explica a indisponibilidade e mantém referências educativas locais. Resultados vazios, limites e falha da IA têm mensagens próprias. Nenhum resultado ou preço de teste é usado em produção.

## Evidência e alcance

A interpretação local reconhece nomes, alguns erros de digitação, sinônimos, sintomas e códigos DTC. Não é um catálogo universal de aplicações. Os filtros de veículo refinam a consulta; não certificam compatibilidade.

As abas classificam resultados pelos títulos, URLs e trechos fornecidos pelas APIs. A síntese recebe até 12 títulos/trechos, não o conteúdo integral das páginas, PDFs ou vídeos. As fontes de fabricantes conhecidos recebem prioridade; resultados repetidos são removidos. O filtro por fabricante restringe os domínios web e das imagens; vídeos continuam sendo pesquisados no YouTube.

A IA recebe instruções para citar fontes existentes, declarar informações ausentes e não preencher lacunas com conhecimento interno. A resposta estruturada rejeita citações desconhecidas, números e códigos que não apareçam nos trechos citados. Aplicações permanecem não confirmadas; diagnóstico e reparo são hipóteses. Essas verificações reduzem erros, mas não provam que uma afirmação foi corretamente interpretada. Pinagens, procedimentos, valores e equivalências devem ser conferidos na documentação original do veículo. Não se gera esquema ou fotografia para preencher ausência de resultados.

Imagens têm link para a página original e atribuição; podem deixar de carregar na origem. Vídeos abrem no YouTube. Links externos são HTTPS públicos, sem credenciais; o servidor consulta apenas endpoints fixos das APIs. Texto externo e resposta de IA são tratados como dados, nunca HTML ou instruções executáveis.

## Histórico e privacidade

Histórico no navegador exige marcar “Guardar pesquisas neste navegador”; conserva até 12 consultas e pode ser apagado. O histórico da conta só grava quando o usuário clica em salvar. GET, POST e DELETE exigem sessão; gravação e exclusão validam origem. Cada usuário lê e limpa somente seu próprio histórico, limitado a 30 itens. Excluir o usuário também exclui seu histórico.

O cache técnico compartilhado armazena consulta, filtros e resultados, sem associar conta. Não inclua dados pessoais na consulta. As APIs recebem os termos e filtros informados. O histórico da conta e o cache técnico são armazenamentos separados.

## Verificação

- `npx tsx --test tests/automotive-search.test.tsx tests/parts-search.test.tsx tests/parts-public-search.test.tsx`
- Banco de teste descartável: `AUTOMOTIVE_TEST_DATABASE_URL=postgresql://... npx tsx --test tests/automotive-search-postgres.test.ts`. O teste cria um schema próprio em transação e faz rollback; não use banco de produção.
- Com o servidor local sem chaves pagas: `npx playwright test tests/browser/automotive-search.spec.ts` (desktop e celular). Integrações positivas usam respostas controladas identificadas como teste. O endpoint real sem configuração também é verificado.

A validação local não comprova credenciais ou acesso comercial no Render. Após configurar as chaves, confira uma consulta real, links de origem, imagens, vídeo, síntese com citações e consumo no painel dos provedores.

Na implementação, passaram 35 testes de serviço/interface e regressão das ofertas, o teste da migração/cache/histórico em PostgreSQL e 16 testes de navegador (nova pesquisa junto às ofertas, desktop/celular, com acessibilidade nos dois temas). ESLint e TypeScript no escopo novo passaram. A geração do cliente Prisma ficou bloqueada pelo download do binário, que retornou HTTP 403 no ambiente; o build completo não foi validado. Não havia chaves externas no ambiente local, portanto as integrações positivas foram verificadas com respostas controladas, não com chamadas pagas reais.
