# Catálogo do sistema de arrefecimento

Disponível na biblioteca de `/artigos` e diretamente em `/artigos?catalog=arrefecimento`. O arrefecimento é a escolha inicial; os outros catálogos continuam disponíveis pelo seletor e por seus parâmetros. A biblioteca passa a reunir arrefecimento, alternador, compressor, módulo dianteiro e Mercedes-Benz.

## Conteúdo

Os 15 componentes preservam a numeração principal do cartaz e dos primeiros 15 itens do arrefecimento interativo. Motor e bypass continuam como contexto, sem criar uma peça de reposição adicional.

Cada componente possui imagem própria, função, observação de identificação e ficha ampliável com acesso à busca de peças. A busca local aceita número exato, nome, função e sinônimos; há filtro por sistema, organização numérica/alfabética, contagem e estado vazio.

Cinco vistas complementares:

- Válvula termostática: tampa, válvula, mola, sede e anel, junto à carcaça.
- Bomba d’água: carcaça, eixo/rolamento, impulsor e junta.
- Circuito principal: motor, termostato, radiador, retorno e bomba; reservatório em ramal de compensação.
- Circuito do aquecedor: alimentação, trocador, retorno e ventilador da cabine, mantendo ar e líquido separados.
- Posição ilustrativa no compartimento do motor.

O fluxo é explicado em cinco passos. Com passagem aberta, o líquido segue motor → termostato → mangueira superior → radiador → mangueira inferior → bomba → motor. O fechamento do termostato não significa parar a bomba: a circulação interna pode continuar pelo bypass, conforme o projeto. O aquecedor pode ter ramal próprio. Vermelho e azul indicam temperaturas relativas.

Inclui sete possibilidades de falha/sintoma, quatro dicas de oficina e aplicação geral em veículos com motor a combustão. As possibilidades orientam inspeção, sem estabelecer diagnóstico isolado. A ligação **Explorar arrefecimento interativo** abre `/categorias/arrefecimento`, preservando o modelo e seus controles.

## Exemplos do cartaz e aplicação

Os valores do material são reproduzidos como exemplos, acompanhados da necessidade de conferir o manual:

- Termostato: 82–88 °C.
- Temperatura de trabalho: 90–105 °C.
- Pressão da tampa: 0,9–1,4 bar, aproximadamente 13–20 psi.
- Fluido orgânico long life citado na referência.
- Troca: 2–5 anos ou 40.000–100.000 km.

Esses exemplos não são especificações universais, critérios isolados de diagnóstico ou intervalos prescritos para todos os veículos. Tecnologia, aprovação, concentração e troca do fluido seguem o fabricante; cor não comprova compatibilidade. Tampa no radiador, vaso pressurizado e reservatório de recuperação dependem da arquitetura. O conteúdo também informa que não se deve abrir o sistema quente ou pressurizado.

## Imagens e implementação

Ilustrações didáticas geradas a partir da referência visual do usuário, identificadas nas legendas e textos alternativos. Não são fotografias de fabricante nem confirmação de dimensões, códigos ou compatibilidade. Arquivos locais, sem API ou URLs remotas:

- `public/images/cooling-reference/components.webp`: três colunas e cinco linhas, 15 imagens. Os limites reais das linhas e suas proporções estão registrados na configuração.
- `public/images/cooling-reference/assemblies.webp`: três colunas e duas linhas, cinco vistas e visão geral na célula 5.

Dados em `src/lib/cooling-reference-catalog.ts`; registro em `src/lib/technical-catalogs.ts`; interface e filtros compartilhados existentes. As imagens conservam suas proporções em áreas de altura uniforme nos cartões do arrefecimento. Os testes de quantidade dos seletores anteriores acompanham o registro para permitir novos catálogos sem alterar seus cenários. Sem mudança de banco, API, credenciais ou modelo 3D.

## Validação

`tests/cooling-reference-catalog.test.tsx` cobre numeração, imagens, busca, conjuntos, fluxo/contexto, exemplos condicionais e HTML inicial. Regressão dos quatro catálogos anteriores e do arrefecimento interativo em `tests/*reference-catalog.test.tsx` e `tests/cooling.test.tsx`.

`tests/browser/cooling-reference-catalog.spec.ts`, mais as quatro suítes anteriores, cobre desktop e celular: filtros, busca, estados vazios, ampliação, foco/Escape, imagens, troca dos cinco catálogos, URL/recarga e axe nos dois temas e nos diálogos.

Resultado: 30 testes e 30 cenários distintos de navegador aprovados, incluindo seis cenários de arrefecimento e 24 de regressão, além de TypeScript restrito aos módulos e testes envolvidos, ESLint e revisão visual. A prévia usa os componentes e o layout reais em rota temporária removida antes do commit. A página completa depende do banco; a compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**. Não exige configuração adicional.
