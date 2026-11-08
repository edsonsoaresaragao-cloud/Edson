# Catálogo de ar-condicionado / HVAC

Disponível em `/artigos` e diretamente em `/artigos?catalog=hvac`, como escolha inicial. A biblioteca mantém também arrefecimento, alternador, compressor, módulo dianteiro e Mercedes-Benz. O seletor usa três colunas em telas grandes, duas em telas intermediárias e uma no celular.

## Conteúdo

Os 12 itens preservam a numeração principal do cartaz e dos primeiros 12 componentes do interativo existente. Cada item tem imagem própria, função, observação de identificação e ficha ampliável com acesso à busca de peças. O aquecedor opcional permanece como contexto; na vista interativa ele já recebe o número 13.

Busca por nome, número exato, função e sinônimos, filtro de sistema, ordenação, contagem e estado vazio. Cinco vistas:

- Circuito do refrigerante, em esquema funcional com conexões explícitas.
- Componentes externos de compressão e troca de calor.
- Caixa HVAC e componentes internos, incluindo aquecedor opcional.
- Acesso de serviço e monitoramento de pressão, como elementos distintos.
- Posição ilustrativa do módulo sob o painel.

A ligação **Explorar ar-condicionado interativo** abre `/categorias/ar-condicionado`, preservando o modelo, a animação e os controles existentes. Há seis passos de funcionamento e uma legenda para vermelho, laranja, amarelo, azul e azul-claro translúcido.

## Distinções técnicas

O circuito adotado é **compressor → condensador → filtro secador → válvula de expansão → evaporador → compressor**. O filtro secador na linha de alta não é tratado como equivalente ao acumulador de arquiteturas com tubo de orifício na baixa pressão. Após a expansão há mistura de líquido e vapor; o retorno ao compressor é de vapor.

O evaporador absorve calor do ar, enquanto a umidade do ar pode condensar nas aletas. Ar da cabine, refrigerante do A/C e líquido do aquecedor permanecem separados. O aquecedor opcional pertence ao arrefecimento do motor; a posição do filtro, blower e trocadores depende do projeto. Portas de serviço são acessos mecânicos; sensores de pressão enviam sinais elétricos.

Cores indicam estados e fluxos de forma didática, sem representar cores reais de mangueiras ou leituras. Não há pressão, quantidade de carga, fluido, lubrificante, pinagem ou procedimento universal prescrito.

## Imagens e esquema

Ilustrações didáticas geradas com base na referência visual do usuário, identificadas nas legendas e textos alternativos. Não são fotografias de fabricante nem confirmação de código, dimensão ou compatibilidade.

- `public/images/hvac-reference/components.webp`: quatro colunas e três linhas, 12 componentes. Limites e proporções reais das linhas na configuração.
- `public/images/hvac-reference/assemblies.webp`: três colunas e duas linhas. Células 1–4 são usadas nas vistas; célula 5 mostra a caixa em corte na apresentação. Célula 0 contém um detalhe adicional de válvula/evaporador e não é usada como circuito.
- `public/images/hvac-reference/refrigerant-cycle.svg`: esquema criado em código com cinco componentes ligados em um único ciclo fechado, rótulos e setas. A legenda o identifica como **Esquema didático do circuito**, separando-o das ilustrações de componentes. Não contém scripts ou referências externas.

As ilustrações do atlas foram revisadas para apresentar os componentes sem conexões fictícias de refrigerante. O trajeto funcional é mostrado pelo esquema, cujas ligações são verificadas nos testes. O cartão e a ficha ampliada utilizam o mesmo arquivo.

## Implementação e validação

Dados em `src/lib/hvac-reference-catalog.ts`; registro em `src/lib/technical-catalogs.ts`. A interface compartilhada aceita uma imagem e legenda específicas por vista para permitir o esquema funcional, mantendo as legendas e o comportamento anteriores por padrão. Os cartões HVAC têm espaço de imagem uniforme, preservando as proporções.

`tests/hvac-reference-catalog.test.tsx` cobre numeração, contexto do aquecedor, busca, distinções técnicas, imagens, proporções, ciclo do SVG e HTML inicial. Regressão dos cinco catálogos anteriores e do HVAC interativo em `tests/*reference-catalog.test.tsx` e `tests/hvac.test.tsx`.

`tests/browser/hvac-reference-catalog.spec.ts`, mais as cinco suítes anteriores, cobre desktop/celular: filtros, busca, ampliação, foco/Escape, esquema, imagens, troca dos seis catálogos, URL/recarga e axe nos dois temas e nos diálogos.

Resultado: 34 testes e 36 cenários de navegador aprovados, além de TypeScript restrito aos módulos e testes envolvidos, ESLint e revisão visual. A prévia utiliza os componentes e o layout reais em rota temporária, removida antes do commit. A página completa depende do banco; a compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado. Sem alterações de banco, API, credenciais ou modelo 3D.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**. Não exige configuração adicional.
