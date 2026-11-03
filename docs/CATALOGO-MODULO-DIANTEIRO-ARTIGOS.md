# Catálogo do módulo dianteiro em Notícias e artigos

Em `/artigos`, a biblioteca permite escolher entre **Compressor de ar-condicionado**, **Módulo Dianteiro** e **Mercedes-Benz**. O compressor é a escolha inicial; `/artigos?catalog=modulo-dianteiro` abre diretamente este catálogo e `/artigos?catalog=mercedes` abre o de motores. A troca atualiza o parâmetro `catalog`, preservando os demais parâmetros da URL, sem buscar novamente os artigos. Os filtros locais de peças são reiniciados ao trocar de catálogo.

## Organização e comportamento

- 20 componentes com a mesma numeração do cartaz e da suspensão interativa existente: estrutura, transmissão/diferencial, freios/rodas, suspensão e direção.
- Imagem individual, função, observação de identificação e ficha ampliável para cada componente. A ficha oferece acesso à busca de peças já existente.
- Cinco vistas: agregado isolado; suspensão McPherson; transmissão com diferencial; freio/cubo; posição do módulo no veículo. Os conjuntos apresentam os elementos e seus números correspondentes. A localização é uma vista de contexto, sem inventar um número de peça.
- Busca imediata por nome, número exato, função ou sinônimo; filtro de sistema; organização numérica ou alfabética; contagem e mensagem de ausência de resultados.
- Diálogo nativo com fechamento por Escape/botão e retorno de foco. Ligação para `/categorias/suspensao`, mantendo a animação de suspensão existente.
- Função geral, seis pontos de manutenção e os exemplos de veículos do cartaz organizados por categoria. Os exemplos não são tratados como aplicações confirmadas, principalmente nas versões AWD/4x4.

## Imagens e distinções técnicas

Foram geradas ilustrações didáticas com base no cartaz fornecido. Não são fotografias de fabricante, desenhos dimensionais ou evidência de compatibilidade. Legendas e textos alternativos identificam essa natureza.

Arquivos locais WebP, sem dependência de links remotos ou chave de API:

- `public/images/front-module-reference/components.webp`: quatro colunas e cinco linhas, itens 1–20. A configuração registra os limites reais das linhas do atlas, que têm alturas ligeiramente diferentes, para que cada ficha mostre apenas sua imagem.
- `public/images/front-module-reference/assemblies.webp`: três colunas e duas linhas; células 0–4 para os conjuntos/localização e célula 5 para a visão geral.

A junta externa é distinguida da interna, ilustrada por uma trizeta/tulipa de exemplo. O diferencial pode estar integrado à transmissão; sua imagem separada é didática. O item 13 mostra o coxim superior removível, distinguindo-o da torre estrutural da carroceria. Pivô e cubo, pinça e suporte têm fichas e imagens diferentes. A pinça acompanha o esterçamento, sem girar com o disco. Arquitetura, assistência de direção e construção das peças dependem do veículo.

## Implementação

Dados e imagens do módulo: `src/lib/front-module-reference-catalog.ts`.

Tipos, busca e posicionamento dos atlas: `src/lib/visual-reference-catalog.ts`. Interface comum: `src/components/visual-reference-catalog.tsx`. Escolha de catálogo: `src/components/technical-catalog-library.tsx`. A configuração Mercedes fica em `src/lib/mercedes-visual-catalog.ts`; seus dados e o componente público anterior foram preservados.

Integração apenas na seção `artigos` de `src/app/[section]/page.tsx`. Sem alteração de banco, conteúdo publicado simulado, nova API, variável de ambiente ou modelo 3D.

## Verificação

`npx tsx --test tests/front-module-reference-catalog.test.tsx tests/mercedes-reference-catalog.test.tsx`: dez testes cobrindo numeração, associação de imagens, busca, ordenação, referências dos conjuntos, distinções técnicas, HTML inicial e preservação do catálogo Mercedes.

`tests/browser/front-module-reference-catalog.spec.ts` e `tests/browser/mercedes-reference-catalog.spec.ts`: doze cenários em desktop/celular, cobrindo filtros, ordenação, estados vazios, fichas, foco/Escape, imagens locais, seleção pela URL e após recarga, preservação de parâmetros, layout sem transbordamento e axe nos temas claro/escuro e nos diálogos.

Resultado: dez testes e doze cenários de navegador aprovados, além de TypeScript restrito aos módulos e testes envolvidos, ESLint e revisão visual. A prévia local usa os componentes e o layout reais em uma rota temporária, removida antes do commit. A página completa depende do banco existente; a compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Depois do envio a `main`, executar **Render → Manual Deploy → Deploy latest commit**. Nenhuma chave ou configuração adicional é necessária.
