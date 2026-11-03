# Catálogo visual Mercedes-Benz em Notícias e artigos

O catálogo é exibido em `/artigos`, logo após o título da página e antes da busca de artigos. Na biblioteca atual, selecione **Mercedes-Benz** ou abra `/artigos?catalog=mercedes`; o catálogo do módulo dianteiro é a escolha inicial. Os conteúdos, filtros, paginação e consultas ao banco existentes permanecem na seção “Notícias e artigos publicados”. Não há mudança de esquema, cadastro de artigo simulado ou API adicional.

## Organização

- 24 componentes, numerados conforme a lista principal do cartaz enviado.
- Sete sistemas: admissão; motor/conjunto interno; lubrificação; turbo/escape; distribuição; arrefecimento; acessórios.
- Cinco subconjuntos: turbo, cabeçote, distribuição, lubrificação e arrefecimento, com os elementos identificados em listas próprias.
- Busca local por nome, número, função, sinônimo ou família de referência; números isolados retornam o item exato. Filtro de sistema, ordem numérica ou alfabética, contagem e estado vazio.
- Ampliação em diálogo nativo com imagem, função, observação de aplicação, fechamento por botão/Escape e retorno de foco. Fichas de componentes oferecem ligação para a busca de peças; subconjuntos mostram a correspondência com os números principais.
- Ligação para o atlas de motores existente, sem exigir que o visitante saia do catálogo para consultar suas imagens.

Dados: `src/lib/mercedes-reference-catalog.ts`. O componente público `src/components/mercedes-reference-catalog.tsx` utiliza a configuração `src/lib/mercedes-visual-catalog.ts` e a interface compartilhada `src/components/visual-reference-catalog.tsx`. A biblioteca `src/components/technical-catalog-library.tsx` organiza a escolha entre os dois catálogos. Integração apenas na condição `section === "artigos"` em `src/app/[section]/page.tsx`. Veja também `docs/CATALOGO-MODULO-DIANTEIRO-ARTIGOS.md`.

## Imagens e referência técnica

O cartaz fornecido pelo usuário orienta os nomes, a numeração e a organização. Foi preparada uma nova imagem local com 24 ilustrações individuais em quatro colunas e seis linhas: `public/images/mercedes-reference/components.webp`. Não é um recorte fiel nem uma cópia pixel a pixel do cartaz. As imagens foram geradas para identificação didática, com sua natureza indicada nas legendas e textos alternativos.

A visão geral usa a ilustração M264 já existente em `public/images/engines/mercedes-benz-m264.webp`. Os cinco subconjuntos reutilizam as células 0, 1, 2, 4 e 5 de `public/images/engines/subassemblies.webp`, um atlas de três colunas e duas linhas. A célula 3, que ilustra correia dentada, não foi usada para representar a correia de acessórios.

Não há fotografia de fabricante, confirmação de código de peça ou indicação de intercambialidade M264/M260. O catálogo é educativo e genérico. As imagens são arquivos locais, sem links remotos que possam expirar.

A capa de acabamento é distinguida da tampa de válvulas. O item 20 representa distribuição por corrente e o item 21 representa polias/correia de acessórios, corrigindo a ambiguidade da marcação 21 no detalhe da corrente do cartaz. A presença de GPF, o tipo de intercooler, a integração do coletor de escape e o acionamento da bomba d’água dependem da versão. Termostato e radiador são identificados como contexto nos subconjuntos, sem aumentar o índice principal de 24 peças.

Os intervalos de potência/torque e o tipo de bomba do cartaz não são transformados em especificações universais. Para informações de uma aplicação documentada, o visitante pode consultar o atlas de motores e suas referências existentes.

## Verificação

- `npx tsx --test tests/mercedes-reference-catalog.test.tsx`: cinco testes de numeração/imagem, sistemas, busca exata e por sinônimos, ordenação, subconjuntos, distinções técnicas, HTML e arquivos locais.
- `tests/browser/mercedes-reference-catalog.spec.ts`: três cenários em desktop/celular, cobrindo busca, filtros, ordenação, vazio, ampliação, foco/Escape, subconjuntos, carregamento de imagens, largura responsiva e axe em temas claro/escuro e no diálogo.
- TypeScript restrito aos módulos e testes novos; ESLint dos arquivos alterados.

A prévia local usa o componente e layout reais em uma rota temporária removida antes do commit. A página completa depende do banco existente. A compilação de produção não foi verificada neste ambiente, pois o cliente Prisma não está gerado. Não são incluídos stubs ou alterações do banco para contornar essa limitação.

Resultado: cinco testes automatizados e seis cenários de navegador aprovados. TypeScript restrito, ESLint, imagens locais e revisão visual aprovados.

## Publicação

Com o commit em `main`, executar **Render → Manual Deploy → Deploy latest commit**. O catálogo não exige uma nova chave, API ou variável de ambiente.
