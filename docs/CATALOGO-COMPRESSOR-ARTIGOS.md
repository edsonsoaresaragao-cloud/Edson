# Catálogo do compressor de ar-condicionado

A biblioteca de `/artigos` passa a oferecer três catálogos: **Compressor de ar-condicionado**, **Módulo Dianteiro** e **Mercedes-Benz**. O compressor é a escolha inicial e também pode ser aberto por `/artigos?catalog=compressor`. Os demais continuam disponíveis por seleção e pelos parâmetros `modulo-dianteiro` e `mercedes`.

## Conteúdo e numeração

O catálogo segue os 16 números do cartaz enviado, com uma imagem por identificação. Há **15 componentes e uma identificação de contexto**: o cartaz repete as conexões nos números 11 e 14. Como no compressor interativo existente, o 11 representa o fluxo de sucção/descarga e o 14 as portas físicas. A ficha de fluxo não oferece busca de compra.

Os grupos são embreagem/polia; carcaças/acionamento; compressão/válvulas; vedações; conexões/elétrica/fluxo. Cada ficha inclui função, observações de identificação e ampliação de imagem. A busca local aceita nome, número exato, função e sinônimos; há filtro de sistema, organização numérica/alfabética, contagem e estado vazio.

Cinco vistas complementares:

- Embreagem magnética, com polia, rolamento, placa e bobina.
- Carcaça frontal, eixo e retentor.
- Conjunto interno de pistões e placa inclinada.
- Válvulas, tampa e conexões traseiras.
- Funcionamento em corte, com entrada azul e saída vermelha.

As vistas relacionam seus elementos com os números do catálogo. O texto explica a compressão do vapor e situa o resfriamento da cabine na evaporação. Inclui os sete pontos de atenção do cartaz: embreagem, rolamento, vazamentos, retentor, conectores, ruídos e contaminação. Tensão elétrica, geometria, fluido, lubrificante, folgas e torques não são transformados em especificações universais.

A ligação **Explorar compressor interativo** abre `/categorias/ar-condicionado/compressor`, mantendo o modelo, a animação e os controles existentes.

## Imagens

Ilustrações didáticas geradas com base na referência visual do usuário, identificadas nas legendas e textos alternativos. Não são fotografias de fabricante, desenhos dimensionais ou confirmação de compatibilidade. São arquivos locais que não dependem de links externos nem de chave de API:

- `public/images/compressor-reference/components.webp`: quatro colunas e quatro linhas, 16 identificações; proporção por célula 4:3.
- `public/images/compressor-reference/assemblies.webp`: três colunas e duas linhas, cinco vistas e compressor montado na célula 5.

O arranjo visual não define sequência de desmontagem/montagem, ajuste de folga ou aperto. O exemplo é de compressor axial com embreagem; compressores sem embreagem ou elétricos e mecanismos diferentes não são tratados como equivalentes.

## Implementação

Dados: `src/lib/compressor-reference-catalog.ts`. Registro dos três catálogos, escolha inicial e validação do parâmetro: `src/lib/technical-catalogs.ts`.

A interface compartilhada `src/components/visual-reference-catalog.tsx` admite identificações de contexto e nomes de contagem apropriados, preservando o comportamento dos catálogos anteriores. A biblioteca mantém os demais parâmetros da URL ao trocar de catálogo. O seletor foi ajustado para três opções em desktop e apresentação vertical no celular. Sem alteração de banco, API, credenciais ou modelo 3D.

## Validação

Testes de dados e HTML em `tests/compressor-reference-catalog.test.tsx`, incluindo numeração, contexto 11/portas 14, imagens, busca, conjuntos e seleção segura do catálogo. Regressão dos dois catálogos anteriores e do compressor interativo em `tests/front-module-reference-catalog.test.tsx`, `tests/mercedes-reference-catalog.test.tsx` e `tests/compressor.test.tsx`.

Navegador: `tests/browser/compressor-reference-catalog.spec.ts`, mais as duas suítes anteriores, em desktop e celular. Cobre busca, filtros, ordem, vazio, foco/Escape, ficha sem compra para fluxo, compra para conexão física, imagens, troca entre três catálogos, URL/recarga e axe nos temas claro/escuro e nos diálogos.

Resultado: 20 testes e 18 cenários de navegador aprovados, além de TypeScript restrito aos módulos e testes envolvidos, ESLint e revisão visual. A prévia local utiliza os componentes e o layout reais em rota temporária, removida antes do commit. A página completa depende do banco; a compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**. Não exige configuração adicional.
