# Buscador automotivo inteligente

A implementação amplia `/pecas` e `/pesquisa-automotiva`, conservando cabeçalho, rotas, biblioteca, histórico, pesquisa técnica e fornecedores já existentes. A navegação passa a ser **PEÇAS | TODOS | IMAGENS | VÍDEOS | DIAGNÓSTICO | ESQUEMAS | CÓDIGOS | MANUAIS**. TODOS continua existindo e também reúne as ofertas. PEÇAS apresenta a pesquisa comercial. As contagens são de resultados recebidos, na página atual; não representam toda a internet.

## Como funciona

- `/api/automotive-search/unified` interpreta a intenção, deriva os termos comerciais e executa os dois handlers existentes em paralelo. Reutiliza credenciais, caches, orçamentos, validações e timeouts. Não faz chamada HTTP ao próprio portal.
- Falhas de pesquisa técnica, IA, imagem, YouTube ou comércio são independentes. Dados de outras fontes continuam disponíveis. Uma falha integral exibe erro e opção de tentar novamente.
- Termos de compra e de sintomas são reconhecidos por regras locais. A síntese de IA é produzida exclusivamente a partir dos títulos/trechos externos recebidos. Não é usada para criar anúncios, preços, frete, descontos, estoque ou compatibilidade.
- Sintomas não confirmam defeito. Um DTC isolado abre CÓDIGOS e não dispara uma busca de substituição de peça. É necessário informar o nome da peça ou referência OEM. Um código OEM pode ser pesquisado sem preencher o nome.
- Intenções de comprar, conhecer, diagnosticar, imagens, vídeos, códigos, especificações e manuais direcionam a aba inicial. O usuário pode escolher outra aba. Alternar abas mantém consulta, veículo, filtros comerciais e paginação, sem chamar novamente os fornecedores.
- `auto` e `auto_*` conservam a pesquisa técnica. `buy`, `carBrand`, `carModel`, `carYear`, `carEngine`, `partCode` e `buyPage` conservam a pesquisa comercial, inclusive links antigos da página de peças.

## Catálogo de veículos

`/api/vehicle-catalog` usa exclusivamente `https://parallelum.com.br/fipe/api/v1/carros/marcas`, com os segmentos documentados da API FIPE pública Parallelum para marcas, modelos, anos e detalhes. O navegador consulta o servidor do portal; não fornece URLs arbitrárias. IDs e hierarquia são validados. Há timeout de seis segundos, cache de seis horas, coalescência, limite local de 120 consultas por minuto e tamanho máximo de resposta.

Montadora e modelo são campos pesquisáveis. Selecionar uma montadora carrega modelos; selecionar um modelo carrega anos; selecionar um ano pode oferecer a descrição exata da versão/combustível retornada pela fonte. Não há tabela fictícia de combinações. A API FIPE pode não separar cilindrada, potência e versão como um catálogo OEM: o campo motor/versão mostra a identificação disponível na fonte e aceita informação manual. Se o catálogo não responder, os campos continuam utilizáveis manualmente, sem inventar opções.

O catálogo FIPE identifica veículos para refinar a busca. **Ele não confirma aplicação de autopeças.** Uma troca de montadora limpa modelo/ano/motor dependentes. Uma troca de modelo limpa ano/motor. Um ano novo limpa a seleção de motor/versão anterior.

## Configuração no Render

Use as variáveis já documentadas em [PESQUISA-AUTOMOTIVA.md](./PESQUISA-AUTOMOTIVA.md) e `.env.example`:

| Função | Integração/configuração |
| --- | --- |
| Web e imagens técnicas | `AUTOMOTIVE_GOOGLE_API_KEY` + `AUTOMOTIVE_GOOGLE_CX`, ou `AUTOMOTIVE_BRAVE_API_KEY` |
| Ofertas Google Shopping | `PARTS_SERPAPI_KEY` (aceita aliases já existentes `SERPAPI_API_KEY`/`SERPAPI_KEY`) |
| Páginas comerciais via API Brave | `PARTS_BRAVE_API_KEY`, `BRAVE_SEARCH_API_KEY` ou `AUTOMOTIVE_BRAVE_API_KEY` |
| Vídeos | `YOUTUBE_API_KEY`, YouTube Data API v3 |
| Síntese fundamentada | `OPENAI_API_KEY`; `AUTOMOTIVE_AI_MODEL=gpt-4.1-mini` por padrão |
| Veículos | Acesso HTTPS a `parallelum.com.br`; endpoint público, sem chave nesta implementação |
| Histórico e cotas compartilhadas | `DATABASE_URL`, usando a migração já existente |

Google Programmable Search técnico não é uma API de preços. Configure a integração comercial separadamente, ou compartilhe uma chave Brave com acesso adequado. As chaves ficam no backend, sem prefixo `NEXT_PUBLIC_`. Não envie chaves pelo chat nem as inclua no Git.

Não há integração direta fictícia com Amazon, Mercado Livre ou Magazine Luiza. Os anúncios vêm das integrações autorizadas configuradas. A busca pública RSS/HTML e o enriquecimento de páginas comerciais já existentes foram preservados e só funcionam quando a origem permite acesso. `PARTS_PUBLIC_SEARCH_ENABLED=false` desliga esse fallback; configure uma API comercial para depender apenas das APIs. Desafios, recusas ou bloqueios não são contornados. Links de pesquisa nas lojas são identificados separadamente dos anúncios recuperados.

Os limites existentes continuam ativos, contando chamadas de API e não cliques nas abas. Além dos limites técnicos, o comércio usa `PARTS_MONTHLY_API_LIMIT`, `PARTS_DAILY_API_LIMIT` e `PARTS_SEARCH_CACHE_SECONDS`. Uma pesquisa unificada pode consumir chamadas de ambos os conjuntos; dimensione as cotas do provedor e do portal. Cache e coalescência evitam chamadas duplicadas. Não foram adicionadas tabelas nem é necessário recriar o banco.

Após configurar o serviço, execute **Manual Deploy → Deploy latest commit**, com Auto Deploy desativado. Confira a migração existente nos logs e realize uma consulta real. Se o ambiente de desenvolvimento também restringir a rede, libere os domínios das APIs utilizadas em suas configurações; isso não substitui configurar as credenciais no Render.

## Ofertas e comparação

A normalização mantém foto, título, descrição, marca, código, aplicação declarada, preço BRL, frete numérico, total, condição, disponibilidade, loja, URL, fonte e datas **quando recebidos da fonte**. Ausências aparecem como “não informado”, “consultar na loja” ou “não verificada”. A consulta não transforma uma referência educativa ou uma ilustração em anúncio.

Metadados estruturados de produto/JSON-LD podem informar esses campos. Valor sem moeda inequívoca não entra na comparação em reais. Frete não é presumido grátis: total só existe quando preço e frete em reais são numéricos. “Consultado em” é o horário da consulta; não é apresentado como horário em que o vendedor alterou o preço. Quando existe data do preço informada pela fonte, ela aparece separadamente e o usuário é orientado a conferir o valor atual no anúncio. Resultados em cache mantêm o horário da coleta.

Aplicação do anúncio é **declarada pelo vendedor**. Correspondência do código no texto não confirma compatibilidade. Nenhuma integração atual certifica aplicação, portanto o filtro “Somente compatibilidade confirmada” pode retornar zero. Preço, versão, conectores, estoque e aplicação devem ser confirmados no anúncio original.

Filtros locais: marca da peça, loja, faixa de preços, condição, foto e compatibilidade confirmada. Ordenação: relevância, menor/maior preço, marca e total com frete conhecido. A etiqueta de menor preço só aparece em grupos com mesma marca, referência explícita, condição e aplicações declaradas; nunca se compara como equivalente uma referência diferente. A etiqueta não inclui frete nem certifica aplicação. Variantes com códigos/condições diferentes no mesmo URL não têm dados ou preços misturados.

**VER OFERTA / COMPRAR** abre o URL específico retornado pela fonte. Resultados do Google Shopping são identificados como tal. A compra é finalizada fora do portal, sem checkout ou pedido automático.

## Conteúdo técnico e mídia

DIAGNÓSTICO e CÓDIGOS exibem fatos citados das categorias pertinentes, incluindo ferramentas, verificações e critérios de decisão quando encontrados. Sem evidência ou IA configurada, a interface informa a lacuna e mantém os links originais. Nenhum valor do fabricante ou pinagem é criado para preencher ausência. A distinção de estrutura DTC padronizada/específica é informativa; a definição exata depende das fontes e do fabricante.

IMAGENS permite ampliação em diálogo com foco e fechamento acessíveis. Há crédito e link original. Não se afirma que a imagem se aplica ao veículo apenas porque ele aparece na consulta. VÍDEOS apresenta miniatura, canal, descrição, publicação e link; a reprodução incorporada é carregada somente quando o usuário clica, para resultados retornados com filtro de incorporação da API. Se o YouTube retirar a autorização, o link original permanece. MANUAIS e ESQUEMAS abrem a publicação original, sem copiar ou redistribuir documentos licenciados. Formato PDF é identificado pela URL quando disponível; aplicação e licença não são inventadas.

As citações e filtros numéricos reduzem respostas sem sustentação, mas não provam interpretação correta da IA. Consulte a publicação original antes de usar códigos, valores ou procedimentos. O portal não lê integralmente todos os documentos: a síntese recebe títulos e trechos das APIs.

## Verificação e limitações do ambiente

- `npx tsx --test tests/intelligent-search.test.tsx tests/automotive-search.test.tsx tests/parts-search.test.tsx tests/parts-public-search.test.tsx`
- Com o servidor local: `npx playwright test tests/browser/intelligent-search.spec.ts tests/browser/automotive-search.spec.ts tests/browser/parts-marketplace.spec.ts` (desktop e celular). A página de peças usa o banco do projeto; a página independente `/pesquisa-automotiva` permite testar o novo componente sem carregar o catálogo SQL.
- A suíte nova cobre peça sem veículo, filtros completos, OEM, sintoma, DTC, anúncios múltiplos, URL específico de compra, oito abas, falha parcial, ofertas vazias, catálogo indisponível, digitação manual, concorrência e preservação dos filtros. Usa os adaptadores e parsers reais com respostas controladas de APIs; esses arquivos de teste não são importados pela aplicação.
- Os logs de falha registram somente provedor e categoria, sem chaves, termos pessoais, respostas completas ou URLs com credenciais.

Neste ambiente não havia chaves de pesquisa/IA/comércio. O acesso à API FIPE foi bloqueado pelo proxy de rede (CONNECT HTTP 403). A geração do Prisma também depende de um binário cujo download já foi bloqueado por HTTP 403, impedindo validar o build completo. O endpoint unificado real foi exercitado sem credenciais e manteve a resposta técnica de configuração mesmo com comércio indisponível. A validação positiva de fornecedores e mídia foi feita com respostas controladas; não comprova preços ao vivo, credenciais, cotas ou acesso externo no Render.

Na verificação desta entrega passaram **45 testes de serviço/dados e regressão**, **24 testes de navegador** nos projetos desktop/celular, ESLint e TypeScript no escopo alterado. Os testes de acessibilidade cobriram os dois temas. Links de página inicial e pesquisa da loja foram rejeitados como anúncios, inclusive quando devolvidos dentro de uma resposta Shopping.
