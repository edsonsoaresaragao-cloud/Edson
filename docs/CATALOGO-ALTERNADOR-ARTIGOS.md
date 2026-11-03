# Catálogo do alternador automotivo

Disponível na biblioteca de `/artigos` e diretamente em `/artigos?catalog=alternador`. Os outros catálogos e a escolha inicial são definidos em `src/lib/technical-catalogs.ts`, com seleção e acesso direto por seu parâmetro `catalog`.

## Conteúdo

Os 16 componentes seguem a numeração do cartaz enviado e do alternador interativo existente. Cada componente tem imagem própria, nome, função, observações de identificação e ficha ampliável. A busca aceita nome, número exato, função e sinônimos; os filtros organizam por sistema e por número/nome. Há contagem e estado vazio.

Sistemas: polia/ventilação; carcaças/apoios/fixação; rotor/estator; excitação/regulação; retificação/conexões.

Cinco vistas complementares:

- Acionamento e apoio dianteiro: polia, porca, ventoinha, rolamento e carcaça.
- Rotor e estator: polos em garra, campo, anéis coletores e enrolamentos fixos.
- Regulação e contato das escovas: regulador e porta-escovas, com anéis coletores como contexto do rotor.
- Retificação e conjunto traseiro: ponte de diodos, rolamento, carcaça, proteção, conexões e fixações.
- Geração e retificação em corte: fases CA e saída CC ilustradas por setas.

As vistas relacionam seus elementos com os números das peças. A ficha permite pesquisar a peça nas lojas pelo sistema existente. **Explorar alternador interativo** abre `/categorias/alternador`, mantendo o modelo, a animação e os controles anteriores.

O catálogo reúne os seis passos de funcionamento e os sete pontos de atenção do cartaz: rolamentos, escovas, regulador, retificador, polia, conectores e superaquecimento.

## Distinções técnicas

A faixa aproximada de 13,8–14,5 V do cartaz é identificada como exemplo. Não é regra universal nem critério isolado de diagnóstico: carga inteligente, temperatura, estado da bateria e condições de teste alteram os valores previstos.

Ventoinha e arruela têm funções diferentes; regulador e porta-escovas podem ser integrados; espaçadores metálicos e isoladores também são distintos. Os anéis coletores contínuos do rotor não são um comutador segmentado de motor de partida. Terminais e comunicação, incluindo B+, S, L, DFM ou COM/LIN, dependem da aplicação e não fornecem pinagem universal.

O exemplo com rotor em garra e polia rígida não representa todas as arquiteturas. A vista explodida não estabelece procedimento de montagem/desmontagem, torque ou reparo.

## Imagens e implementação

Ilustrações didáticas geradas com base no cartaz, identificadas nas legendas e textos alternativos. Não são fotografias de fabricante nem confirmação de código, dimensão ou compatibilidade. Arquivos WebP locais, sem chave de API ou links remotos:

- `public/images/alternator-reference/components.webp`: quatro colunas e quatro linhas, 16 componentes.
- `public/images/alternator-reference/assemblies.webp`: três colunas e duas linhas, cinco vistas e alternador montado na célula 5.

Os limites reais das linhas estão registrados na configuração. O posicionamento e a proporção das imagens levam em conta as alturas desiguais do atlas, mantendo a região de cada componente sem deformação. O mesmo tratamento melhora a apresentação dos atlas anteriores com linhas desiguais.

Dados em `src/lib/alternator-reference-catalog.ts`; registro e seleção em `src/lib/technical-catalogs.ts`; interface compartilhada nos componentes existentes. O seletor apresenta os catálogos disponíveis em duas colunas no desktop e uma no celular. Sem alteração de banco, API, credenciais ou modelo 3D.

## Validação

`tests/alternator-reference-catalog.test.tsx` cobre numeração, imagens, busca, conjuntos, observações técnicas, proporções das regiões e HTML inicial. Regressão dos três catálogos anteriores e do alternador interativo em `tests/*reference-catalog.test.tsx` e `tests/alternator.test.tsx`.

`tests/browser/alternator-reference-catalog.spec.ts`, mais as três suítes anteriores, cobre desktop e celular: busca, filtros, ordenação, estado vazio, ampliação, foco/Escape, imagens locais, troca entre quatro catálogos, URL e recarga, acessibilidade axe nos temas claro/escuro e nos diálogos.

Resultado: 25 testes e 24 cenários de navegador aprovados, além de TypeScript restrito aos módulos e testes envolvidos, ESLint e revisão visual. A prévia usa os componentes e o layout reais em rota temporária removida antes do commit. A página completa depende do banco; a compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**. Não exige configuração adicional.
