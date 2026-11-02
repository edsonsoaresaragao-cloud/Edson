# Busca de ofertas de peças automotivas

## Entrega

A área superior de `/pecas` passa a pesquisar ofertas por peça ou código, marca/modelo/ano do veículo e motor/versão. A biblioteca técnica existente continua abaixo, com seus próprios filtros e paginação. Consulta comercial usa parâmetros independentes (`buy`, `carBrand`, `carModel`, `carYear`, `carEngine`, `partCode`, `buyPage`), preservando os filtros técnicos.

Cartões exibem título, foto quando fornecida, descrição/snippet da fonte quando disponível, loja, preço original, entrega informada pela fonte, origem e link. Ausência de descrição, foto ou preço é identificada, sem inventar dados. Links diretos abrem a loja; links de produto do Google Shopping são identificados como intermediários. Não há checkout, cadastro de pagamento ou compra automática no portal.

Filtros locais por loja e presença de foto, ordenação de preços inequívocos em BRL, indicação de código presente no anúncio, até cinco páginas, limpeza de busca e URL compartilhável. Termos de veículo refinam a pesquisa; não validam aplicação mecânica. Código presente no título/snippet não significa compatibilidade confirmada.

## Ativação no Render

O usuário informou que ainda não possui API e pediu a integração preparada. Nenhuma conta foi criada, assinatura contratada ou chamada paga efetuada nesta sessão.

1. Criar uma conta no provedor escolhido e obter sua chave no painel oficial.
2. Em **Render → serviço web → Environment**, adicionar pelo menos uma variável secreta:
   - `PARTS_SERPAPI_KEY`: SerpApi, endpoint `https://serpapi.com/search.json`. Habilita Google Shopping e, na ausência de Brave, uma consulta complementar Google Web.
   - `PARTS_BRAVE_API_KEY` (opcional/alternativa): Brave Search, endpoint `https://api.search.brave.com/res/v1/web/search`. Complementa o Shopping com páginas de produtos e snippets. Sozinha permite busca web, sem garantia de preço/foto em todas as páginas.
3. Conferir limites do plano e ajustar os limites locais conforme necessário:
   - `PARTS_MONTHLY_API_LIMIT=100`: reservas de chamadas externas por mês UTC, compartilhadas no banco.
   - `PARTS_DAILY_API_LIMIT=50`: limite diário compartilhado.
   - `PARTS_SEARCH_CACHE_SECONDS=900`: cache de resultados completos (permitido de 60 a 1800 segundos).
4. Salvar e executar **Manual Deploy → Deploy latest commit**.
5. Abrir `/pecas`, pesquisar uma peça/código e conferir fontes, imagem, preço e link na loja real.

Não usar prefixo `NEXT_PUBLIC_` nem colocar a chave no código ou enviar pelo chat. SerpApi sozinho consulta dois endpoints por busca sem cache; com SerpApi e Brave, são Shopping + Brave; com apenas Brave, uma chamada. Reservas podem contar tentativas que não chegaram a produzir resultados e não equivalem a faturamento confirmado pelo provedor. Os limites locais não substituem os limites configurados no próprio provedor.

Sem chave, a página mostra claramente que a busca integrada ainda não está ativa e oferece pesquisas externas em Mercado Livre, Amazon Brasil, Google Shopping e Bing Shopping. Esses atalhos não são apresentados como anúncios consultados, nem têm imagens/preços simulados.

## Cobertura e dados

Cobertura das fontes conectadas, sem promessa de pesquisar todas as lojas da internet. Configuração de país Brasil e idioma português. Shopping fornece anúncios; web retorna candidatos filtrados por URL de produto ou metadados estruturados. Páginas iniciais, busca, artigos e redes sociais são excluídos dos candidatos web. O filtro é heurístico e pode deixar de retornar lojas sem estrutura reconhecível.

Registros duplicados pela URL canônica são mesclados, preservando descrição/foto e registrando as fontes. Removem-se fragmento e parâmetros comuns de rastreamento; SKU e demais parâmetros de produto permanecem. Preços só participam da ordenação quando BRL é inequívoco; não há conversão de moeda. Produtos com preço ausente ficam depois dos preços conhecidos. Preço, estoque, frete e aplicação devem ser conferidos no anúncio; não são validados em tempo real no checkout.

Descrições e fotos vêm da resposta da API, não de um crawler próprio. Fotos são carregadas diretamente no navegador com `referrerPolicy=no-referrer`; sem imagem ou com falha, aparece indicação de indisponibilidade. Nenhuma foto gerada ou catálogo de exemplo é usado em produção. As fixtures em `tests/fixtures/parts-search.json` são sintéticas e exclusivas de testes.

## Robustez e operação

- `/api/parts-search`: entrada validada, campos limitados, código sozinho permitido e páginas 1–5.
- Endpoints externos fixos, timeout de oito segundos, limite de resposta de 2 MB e redirects externos rejeitados no servidor.
- URLs públicas HTTPS; credenciais em URL, protocolos inseguros, endereços locais/IP e parâmetros explícitos de API são rejeitados. Não há fetch servidor de links de lojas ou fotos.
- Chaves apenas no servidor. Erros de upstream são reduzidos a estados públicos, sem URLs privadas, corpo do erro, tokens ou stacks.
- Cache local por processo, limitado a 100 consultas. Requisições simultâneas iguais compartilham trabalho. Cache depende também da configuração de provedor; mudança de chave não reutiliza consulta de outra configuração. Falha parcial tem cache de um minuto; falha total não é armazenada.
- Resultados parciais preservam as fontes que responderam. Fontes limitadas/indisponíveis são identificadas. Nenhum resultado inventado substitui uma fonte com falha.
- Controle persistente de chamadas usa `RateLimit` existente, sem nova migração. Há limite global de 120 consultas por minuto quando existe configuração de API. Cache não consome o orçamento de chamadas externas; o limitador de entrada continua valendo.
- Interface aborta consultas anteriores e ignora respostas obsoletas, mantendo a busca mais recente.

Como parte da integração, `contentUrl` foi movido ao catálogo puro, mantendo reexportação compatível em `content.ts`. Assim componentes visuais (inclusive a página 404) deixam de carregar Prisma só para montar links. Isso permitiu verificar a interface isoladamente sem conexão ao banco.

Privacidade e termos foram complementados com a descrição das consultas a terceiros e das compras realizadas nos sites de destino.

## Verificação

- 14 testes automatizados de entrada/código, adapters, normalização/deduplicação, URLs, preço, cache/coalescência/expiração, ausência de API, limite/falha parcial/total, payload excessivo, paginação, handler e HTML.
- 6 testes Playwright (três cenários em desktop e celular): formulário, preços, loja/foto, paginação, limpeza, estado sem API e cancelamento de busca obsoleta. Axe sem violações nos critérios WCAG 2A/AA/2.1AA do componente, em temas claro e escuro.
- Navegador local usou uma rota temporária só com o componente e respostas controladas; essa rota foi removida. A suíte permanente usa `/pecas` por padrão em ambiente com banco, aceitando `PARTS_PREVIEW_PATH` para verificação isolada.
- TypeScript direcionado aos novos módulos e lint aprovados. Sem consulta real aos provedores, pois não há chaves. Banco/limites persistentes e build completo não foram verificados neste ambiente, cujo cliente Prisma não está gerado.

Comandos: `npx tsx --test tests/parts-search.test.tsx`; `TEST_BASE_URL=http://localhost:3000 npx playwright test tests/browser/parts-marketplace.spec.ts` em uma aplicação configurada. Não inserir dados das fixtures em catálogos públicos.
