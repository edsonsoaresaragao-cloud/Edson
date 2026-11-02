# Busca de ofertas de peças automotivas

## Funcionamento

A área superior de `/pecas` pesquisa produtos por nome/código, marca, modelo, ano e motor. A biblioteca técnica existente permanece abaixo, com filtros independentes. A URL comercial usa `buy`, `carBrand`, `carModel`, `carYear`, `carEngine`, `partCode` e `buyPage`.

A consulta **não exige uma chave de API por padrão**. Sem chave, o servidor consulta o feed RSS público do Bing e a busca HTML pública do DuckDuckGo. Se APIs configuradas falharem, atingirem o limite ou não retornarem produtos, essas fontes públicas também são consultadas. Não são contornados CAPTCHA, autenticação ou bloqueios de lojas; uma fonte que recusa a consulta é identificada como indisponível.

São aceitos candidatos com URL reconhecível de produto e termos relacionados à peça. Iniciais de lojas, páginas de busca, categorias, artigos, redes sociais e URLs inseguras são descartados. Para siglas específicas como MAF e MAP, a sigla solicitada precisa estar no título ou na URL do produto; uma menção secundária no snippet não basta. O filtro é heurístico e pode excluir lojas e páginas não reconhecidas.

Cartões de produtos mostram o link indexado e o texto recebido da fonte. Quando disponíveis, também mostram foto e preço. Para completar esses campos, até seis páginas de produto em lojas explicitamente permitidas são consultadas, com no máximo três consultas simultâneas. Metadados JSON-LD de produto e Open Graph fornecem os dados; não se inventam preços, fotos, frete ou estoque. Se a loja não responder, o link e o snippet indexados são preservados. Não há checkout ou compra automática no portal.

Os anúncios são distintos das **referências técnicas**. Durante a busca, ou quando não há anúncios, uma peça reconhecida no catálogo local aparece com imagem, função, inspeção e link de pesquisa no Mercado Livre. A ficha informa explicitamente que não é um anúncio, não comprova aplicação e não tem preço/estoque consultados. Usa as fotos de referência enviadas ou as ilustrações geradas identificadas do catálogo. Não há seleção aleatória de peça para uma consulta genérica como “sensor”.

O erro de digitação “senso maf” é pesquisado como “sensor maf”, mantendo marca, modelo, ano, motor e código. A correção é limitada a erros conhecidos antes de siglas e é informada na tela. MAF não é convertido em MAP. Os campos de veículo refinam os termos; não comprovam compatibilidade.

## Publicação no Render

1. Publicar o commit: **Render → Manual Deploy → Deploy latest commit**.
2. Pesquisar, por exemplo, `sensor MAF`, com os dados do veículo. A ficha técnica aparece mesmo durante uma falha externa, se a peça for reconhecida pelo catálogo.
3. Conferir fontes consultadas, fotos, descrições e links dos produtos retornados. As fontes públicas podem limitar consultas automatizadas e a cobertura varia. A verificação em produção continua necessária.

Nenhuma conta, assinatura ou chave é necessária para tentar as fontes públicas. Para desativá-las explicitamente, configurar `PARTS_PUBLIC_SEARCH_ENABLED=false`; sem uma API nesse caso, não haverá consulta externa integrada.

## APIs opcionais

APIs podem fornecer cobertura e informações comerciais mais completas. Nunca colocar chaves no código, no chat ou em variáveis `NEXT_PUBLIC_`.

- `PARTS_SERPAPI_KEY`: Google Shopping e Google Web por `https://serpapi.com/search.json`. Também são reconhecidos `SERPAPI_API_KEY` e `SERPAPI_KEY`, para instalações que já usavam esses nomes.
- `PARTS_BRAVE_API_KEY`: busca de páginas de produtos por `https://api.search.brave.com/res/v1/web/search`. Também é reconhecido `BRAVE_SEARCH_API_KEY`. Substitui Google Web quando configurada junto com SerpApi.
- `PARTS_MONTHLY_API_LIMIT=100`: reserva de chamadas pagas no mês UTC.
- `PARTS_DAILY_API_LIMIT=50`: reserva diária de chamadas pagas.
- `PARTS_SEARCH_CACHE_SECONDS=900`: cache de respostas completas, de 60 a 1800 segundos.

Reservas são compartilhadas pela tabela `RateLimit` existente e podem contar tentativas malsucedidas. Esses limites não substituem os limites do provedor. Consultas públicas e metadados de lojas não consomem esse orçamento de API; todas as pesquisas passam por um limite global de 60 consultas por minuto. Nenhuma chave foi fornecida ou assinatura contratada nesta sessão.

## Dados, limites e segurança

- Entrada validada; campos limitados; código sozinho permitido; páginas de 1 a 5. Uma fonte só habilita próxima página quando houver indicação correspondente. O RSS do Bing não anuncia paginação confiável e não a habilita.
- Endpoints fixos para motores de busca. Tempo máximo de oito segundos para API e seis segundos para cada fonte pública, com respostas de até 2 MB.
- Consulta de metadados somente aos hosts fixos definidos em `merchantMetadataUrl`, em `src/lib/parts/public-search.ts`. Não é um proxy para URLs fornecidas pelo usuário ou qualquer domínio indexado.
- Metadados: prazo total de 3,5 segundos por página, até dois redirecionamentos no mesmo host permitido, HTML de até 1,5 MB. Destino local/IP, credenciais em URL, protocolo inseguro, host semelhante e redirecionamento para outro host são rejeitados. Imagens são carregadas diretamente no navegador com `referrerPolicy=no-referrer`.
- XML com declarações de entidade/DOCTYPE e páginas reconhecidas de verificação são recusados. Texto é mostrado como texto; scripts de terceiros não são executados. JSON-LD inválido não impede a exibição do link indexado.
- Duplicatas são mescladas por URL canônica, removendo apenas parâmetros comuns de rastreamento. SKU e outros parâmetros de produto permanecem. Preços participam da ordenação somente quando BRL é inequívoco. Sem preço, o cartão informa “Preço no anúncio”.
- Cache por processo de até 100 consultas; pedidos simultâneos iguais compartilham o trabalho. A chave de cache inclui a configuração de provedores e a opção de busca pública. Resposta parcial tem cache de um minuto; falha total não é armazenada. Cache não consome o orçamento externo novamente.
- Erros de fonte são reduzidos a estados públicos, sem expor chaves, URL privada, corpo de erro ou stack. A interface cancela consultas antigas e ignora respostas obsoletas.
- Fontes e referências não garantem aplicação mecânica, estoque, frete ou cobertura de todas as lojas. A compra é concluída no site de origem.

## Verificação local

Os testes utilizam fixtures sintéticas exclusivamente em `tests/fixtures`. Não há anúncios de exemplo inseridos na aplicação em produção.

- `npx tsx --test tests/parts-search.test.tsx tests/parts-public-search.test.tsx tests/sensor-actuator-catalog.test.tsx`: 28 testes de consulta, fontes, parsing, correção de texto, MAF/MAP, metadados, destinos permitidos, redirecionamentos, chave opcional, limite pago, cache, handler, referência local, HTML e regressão do catálogo.
- `tests/browser/parts-marketplace.spec.ts`: quatro cenários em desktop e celular, incluindo a consulta do pedido (`senso maf`, Chevrolet, Onix, 2022, 1.0), fluxo sem chave por serviço/handler/interface e referência visual imediata mesmo com falha externa. Verificação de filtros, paginação, fotos, links e cancelamento de resposta antiga; axe nos componentes.
- `tests/browser/sensor-actuator-catalog.spec.ts`: regressão após extrair a imagem compartilhada para `component-reference-image.tsx`.
- TypeScript restrito e ESLint dos arquivos alterados.

A interface foi executada com Next e o layout reais em rotas temporárias removidas antes do commit. O ambiente bloqueia acesso externo a Bing, DuckDuckGo e lojas: não houve validação remota das fontes nem comprovação de disponibilidade em produção. Banco, limite persistente e compilação de produção não foram executados aqui porque o cliente Prisma não está gerado. A correção não altera o esquema do banco.
