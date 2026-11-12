# Buscador Inteligente de Peças e Soluções Automotivas

## Interface e rotas

A página `/pecas` mantém o cabeçalho, a identidade, os menus e a estrutura existentes. Seu título agora é “Buscador Inteligente de Peças e Soluções Automotivas”. Há **um único formulário** com a pergunta “O que você procura para seu veículo?”, o botão “Pesquisar”, sugestões, filtros opcionais, histórico e limpeza da consulta.

A pesquisa alimenta **PEÇAS | TODOS | IMAGENS | VÍDEOS | DIAGNÓSTICO | ESQUEMAS | CÓDIGOS | MANUAIS**, nessa ordem. A barra aparece depois da pesquisa, permite teclado e rolagem horizontal no celular. TODOS prioriza a resposta técnica e reúne ofertas, fontes e mídia. PEÇAS mostra os anúncios e links de compra. O formulário de ofertas antigo é reutilizado em modo de resultados, sem gerar um segundo formulário na tela.

O antigo bloco técnico independente e a biblioteca de cards educativos retirados pelo proprietário não voltaram. A rota `/pesquisa-automotiva` continua redirecionando para `/pecas`. Conteúdos educativos e catálogos das outras páginas continuam disponíveis. Nada foi excluído do banco.

`auto` e `auto_*` conservam os filtros técnicos. `buy`, `carBrand`, `carModel`, `carYear`, `carEngine`, `partCode` e `buyPage` mantêm compatibilidade com URLs antigas de ofertas. Trocar abas conserva o estado local, inclusive os filtros comerciais. Histórico local é optativo; histórico de conta exige autenticação, validação de origem para gravação/exclusão e isolamento por usuário.

## Serviços e carregamento progressivo

`GET /api/automotive-search/unified` recebe `q`, `brand`, `model`, `year`, `engine`, `code`, `source` e os controles:

| Parâmetro | Valores |
| --- | --- |
| `offerPage` | 1 a 5 |
| `scope` | `all`, `technical`, `commercial` |
| `stream` | `0` (JSON) ou `1` (NDJSON progressivo) |
| `tab` | Os oito nomes das abas; indicação de apresentação |
| `sort` | `relevance`, `low`, `high`, `brand`, `total` |

O formulário pede `stream=1`. O servidor envia primeiro a interpretação/consulta e depois cada resultado técnico ou comercial assim que ele termina, encerrando com `complete`. Uma categoria não espera a conclusão da outra. O cliente consome os eventos progressivamente, mostra carregamento separado e preserva dados já recebidos se a conexão cair. Fontes técnicas independentes também são consultadas em paralelo, com timeout próprio. Consultas obsoletas são canceladas no cliente; a geração impede que respostas antigas sobrescrevam a atual. Uma consulta externa já iniciada pode continuar no servidor para alimentar o cache compartilhado.

A tentativa novamente de pesquisa técnica usa apenas essa categoria. Paginação/repetição comercial usa `scope=commercial`, sem repetir a pesquisa técnica. Trocar aba não dispara outra chamada. Cache e coalescência existentes continuam valendo. `sort` organiza a página recuperada, não todas as ofertas da internet.

A intenção inicial usa regras para compras, aprendizado, diagnóstico, imagens, vídeos, DTC, especificações e manuais. Quando a IA está configurada, a resposta estruturada também classifica a intenção; ela só muda a aba inicial se o usuário ainda não tiver escolhido outra. Um DTC isolado, inclusive com veículo no texto, não determina uma peça para compra. OEM sozinho pode preencher o termo da busca sem inferir veículo.

## Catálogo de veículos

`/api/vehicle-catalog` consulta exclusivamente a API pública FIPE Parallelum: `https://parallelum.com.br/fipe/api/v1/carros/marcas`, com seus segmentos de modelos, anos e detalhes. Marca/modelo são pesquisáveis. Selecionar marca limpa dependentes e carrega modelos; modelo carrega anos; ano pode oferecer a descrição exata da versão/combustível retornada pela fonte. Não há lista fictícia de motorizações.

A FIPE não substitui um catálogo de aplicação OEM e pode não separar cilindrada e versão. O campo motor/versão permite selecionar a identificação disponível e também aceita texto manual. Sem resposta da API, os campos continuam utilizáveis manualmente; não são criadas opções de modelo/ano/motor. Há validação de hierarquia/IDs, cache de seis horas, coalescência, limite local e timeout de seis segundos. A seleção do veículo refina a consulta e **não certifica compatibilidade da peça**.

## Configuração de produção

Use o serviço Render existente e suas variáveis, sem criar outro site ou banco:

| Função | Configuração |
| --- | --- |
| Web/imagens técnicas | `AUTOMOTIVE_GOOGLE_API_KEY` e `AUTOMOTIVE_GOOGLE_CX`, ou `AUTOMOTIVE_BRAVE_API_KEY` |
| Ofertas Shopping | `PARTS_SERPAPI_KEY` (também aceita os aliases existentes) |
| Busca comercial Brave | `PARTS_BRAVE_API_KEY`, `BRAVE_SEARCH_API_KEY` ou `AUTOMOTIVE_BRAVE_API_KEY` |
| Vídeos | `YOUTUBE_API_KEY`, com YouTube Data API v3 habilitada |
| Interpretação/síntese | `OPENAI_API_KEY`, modelo padrão `AUTOMOTIVE_AI_MODEL=gpt-4.1-mini` |
| Veículos | HTTPS permitido para `parallelum.com.br`; sem chave neste adaptador |
| Histórico, cache e cotas | `DATABASE_URL` do PostgreSQL existente |

As chaves ficam exclusivamente no servidor, sem prefixo `NEXT_PUBLIC_`. Não envie chaves pelo chat nem as versione. Google Programmable Search técnico não fornece preços: configure o comércio separadamente, ou use Brave com permissões adequadas. Não há API direta fictícia de Mercado Livre, Amazon ou Magazine Luiza. Anúncios vêm dos serviços autorizados configurados; links de pesquisa externa são identificados como atalhos, não como anúncios já consultados.

**A nova experiência usa APIs comerciais por padrão.** O fallback público RSS/HTML só é usado nela com `PARTS_PUBLIC_SEARCH_ENABLED=true`, quando o operador tem acesso permitido às fontes. Não são contornados bloqueios, captchas ou recusas. A API antiga `/api/parts-search` mantém seu comportamento anterior para clientes existentes; as cotas, validações e o serviço comercial foram centralizados em `src/lib/parts/runtime.ts`. Para uma implantação somente com APIs, configure `PARTS_PUBLIC_SEARCH_ENABLED=false`.

Limites técnicos: `AUTOMOTIVE_WEB_DAILY_LIMIT`, `AUTOMOTIVE_WEB_MONTHLY_LIMIT`, `AUTOMOTIVE_AI_DAILY_LIMIT`, `AUTOMOTIVE_YOUTUBE_DAILY_SEARCHES`. Limites comerciais: `PARTS_DAILY_API_LIMIT`, `PARTS_MONTHLY_API_LIMIT`, `PARTS_SEARCH_CACHE_SECONDS`. Cache técnico: `AUTOMOTIVE_CACHE_SECONDS`. Os valores padrão existentes continuam. Web e imagens podem consumir chamadas separadas; uma busca YouTube normalmente consome 100 unidades da cota real do Google. Considere a sincronização de vídeos que usa a mesma chave. Reserva de cota paga falha fechada se o banco estiver indisponível. Consultas em cache não fazem outra chamada ao fornecedor.

Não foram alterados esquema, migrações ou dados do banco. O processo existente `scripts/start-render.sh` continua aplicando as migrações necessárias antes de iniciar o standalone. Depois de configurar as variáveis, execute **Manual Deploy → Deploy latest commit**, pois o Auto Deploy está desativado neste projeto.

## Dados comerciais e evidência

Os cards exibem imagem de origem, título, descrição, marca, código, aplicação declarada, preço BRL, frete, total, condição, estoque, loja, URL específica, fonte e datas **quando a integração informa esses dados**. Ausências ficam explícitas. Total só é calculado com preço e frete numérico em reais. Não se presume frete grátis. “Consultado em” é a coleta, não uma confirmação de que o vendedor atualizou o preço nesse momento. Data de preço fornecida pela origem é mostrada separadamente; cache mantém o horário original.

Há três estados de aplicação: confirmada por integração técnica, declarada pelo vendedor e não verificada. Nenhum adaptador atual certifica aplicação OEM: o filtro de confirmação pode retornar zero. Correspondência de texto/código não certifica compatibilidade. A menor oferta só é marcada em grupos com mesma marca, referência explícita, condição e aplicações; a comparação não inclui frete nem confirma aplicação. Variantes diferentes no mesmo URL não têm seus preços misturados.

**VER OFERTA / COMPRAR** abre o produto retornado pela fonte. Páginas iniciais e páginas de busca da loja não são transformadas em anúncios. Google Shopping é identificado quando só está disponível o URL específico desse serviço. A compra é concluída fora do portal.

## Conhecimento técnico e mídia

DIAGNÓSTICO organiza nove etapas: sintoma, funcionamento, causas, ferramentas, testes, interpretação, confirmação, reparos e referências. Cada trecho fundamentado tem citações e classificação geral/hipótese/não confirmado. Etapas sem evidência informam a ausência; nenhum valor universal de tensão, pinagem ou reparo é inventado. CÓDIGOS separa a estrutura geral do DTC da definição efetivamente encontrada nas fontes.

IMAGENS amplia em diálogo acessível e filtra tipos pelos títulos/URLs da origem; não é uma classificação visual nem confirmação de aplicação. VÍDEOS apresenta canal, miniatura, resumo, publicação e link, com player carregado após clique quando a API permite incorporação. Caso a autorização mude na origem, o link continua disponível. MANUAIS/ESQUEMAS mostram origem e formato quando identificável e abrem a publicação original; aplicação/licença ausente não é inventada e documentos protegidos não são redistribuídos.

A IA recebe títulos e trechos, não a leitura integral de todos os documentos. Citações desconhecidas e números/códigos ausentes nos trechos citados são rejeitados. Essas verificações não provam correção semântica de toda resposta. Confirme procedimentos, valores, OEM e aplicação na documentação original.

## Verificação e pendências

- Serviços: `npx tsx --test tests/intelligent-search.test.tsx tests/automotive-search.test.tsx tests/parts-search.test.tsx tests/parts-public-search.test.tsx`.
- Interface nova: `npx playwright test tests/browser/search-platform.spec.ts tests/browser/automotive-search.spec.ts`, com servidor local.
- Os testes comerciais foram adaptados à página pública `/pecas`, incluindo paginação sem repetir a pesquisa técnica e o fallback explicitamente autorizado.
- Cobertura: busca por peça/OEM/sintoma/DTC, veículo completo ou ausente, catálogo dependente/manual, oito abas, links e preços, filtros, mídia, histórico, erro parcial, resposta vazia, cancelamento e URL. Há teste específico de streaming que comprova a entrega comercial antes de uma fonte técnica deliberadamente lenta.

Não há chaves externas disponíveis neste ambiente. Validações positivas de fornecedores/IA usam respostas controladas, explicitamente restritas a `tests/`; não são importadas em produção. O endpoint real sem credenciais foi exercitado e não fabrica anúncios. O acesso à API FIPE esteve bloqueado pelo proxy HTTP 403 nos trabalhos anteriores; o teste do catálogo valida os parsers e a hierarquia com respostas controladas, não comprova acesso ao serviço no Render.

A geração do Prisma nesta entrega falhou ao baixar o checksum do binário (`binaries.prisma.sh`, HTTP 403). Sem gerar esse cliente, a verificação TypeScript que alcança o banco informa `PrismaClient` ausente, e o build completo não fica validado. Esses bloqueios e a ausência de credenciais não foram ocultados por stubs de produção ou preços fictícios. Após publicar, valide uma consulta real por integração, permissões de mídia, coleta de preços, cotas e logs no Render.


## Arquivos principais alterados

| Arquivo/grupo | Responsabilidade |
| --- | --- |
| `src/app/[section]/page.tsx` | Título, descrição e integração na rota existente de peças |
| `src/components/automotive-search/search.tsx` | Formulário único, oito abas, estado, histórico e consumo progressivo |
| `src/components/automotive-search/vehicle-filters.tsx` | Seletores dependentes e entrada manual |
| `src/components/automotive-search/evidence.tsx` | Diagnóstico em nove etapas e consulta DTC |
| `src/components/parts-marketplace.tsx` | Resultados em modo integrado, cards, filtros e compra |
| `src/lib/automotive-search/{unified,stream,media}.ts` | Orquestração, protocolo progressivo e tipos de imagem |
| `src/lib/automotive-search/{ai,contracts,providers,service}.ts` | Interpretação por IA, evidência e adaptadores técnicos |
| `src/lib/parts/{runtime,details,catalog,providers,public-search,service}.ts` | Cotas comerciais, normalização, variantes e comparação |
| `src/lib/vehicles/catalog.ts` e `src/app/api/vehicle-catalog/route.ts` | Catálogo verificável e proteção das consultas |
| `src/app/api/automotive-search/unified/route.ts` | Endpoint unificado |
| `src/app/api/parts-search/route.ts` | Compatibilidade da API comercial antiga |
| `src/app/globals.css`, `.env.example` | Apresentação e configuração |
| `tests/intelligent-search.test.tsx`, `tests/browser/search-platform.spec.ts`, `tests/fixtures/intelligent-search.ts` | Cobertura nova; demais suítes de pesquisa/ofertas foram atualizadas |

Resultado da verificação final: **50 testes de serviço/dados**, **16 testes de navegador em desktop/celular** e ESLint passaram. Inclui acessibilidade nos dois temas, resposta progressiva antes da fonte lenta e repetição técnica sem repetir comércio. O comando `npm run build` foi executado e parou na geração do Prisma por HTTP 403 antes de compilar a aplicação; a checagem TypeScript que importa o banco também depende desse cliente ausente. Não se afirma que o build completo ou as integrações pagas foram validados.
