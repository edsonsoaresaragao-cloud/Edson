# Diagnóstico avançado do alternador

## Acesso e uso

A central fica em `/diagnostico/alternador`. Há acesso destacado no catálogo de artigos (`/artigos?catalog=alternador`), na categoria com o visualizador 3D e na área geral `/diagnostico`. A ficha ampliada de cada peça oferece “Diagnosticar este componente”, com a numeração preservada. O parâmetro `?component=1…16` abre a ficha e sincroniza o destaque no visualizador existente; clicar no visualizador atualiza a ficha.

1. Identifique montadora, modelo, ano/versão, motor, combustível, tensão, bateria, gerenciamento e código da peça. Preencha técnico, reclamação, histórico, capacidade, quilometragem e placa opcional quando conhecidos.
2. Selecione sintomas e consulte a sequência recomendada. Os modos Aprendiz e Profissional mantêm os mesmos critérios, com diferentes níveis de explicação.
3. Registre resultados e evidências nas oito etapas, incluindo condições, consumidores e medições. Campos vazios permanecem não medidos. “Não sei”, “não testado” e “não aplicável” não confirmam defeitos.
4. Associe uma fonte técnica à identificação atual ou escolha uma aplicação publicada pela administração. A associação usa montadora, modelo, ano/versão, motor, código, tensão, bateria e gerenciamento. Alterar esses campos invalida a associação anterior.
5. Consulte as interpretações, hipóteses e próxima verificação. Registre reparo e reteste antes de usar o status resolvido.
6. Salve na conta para retomar em outro acesso, ou use rascunho opcional na mesma aba. Imprima, exporte PDF/texto/JSON ou use compartilhamento nativo quando disponível. A importação JSON é validada e não concede procedência administrativa à referência importada.

O relatório contém número, data em America/Fortaleza, técnico, veículo, condições, testes, medições/unidades, referências, DTCs, evidências, hipóteses, causa confirmada quando houver, reparo, peças e confirmação posterior. Os dados são informados pelo técnico; não há aquisição automática de scanner ou osciloscópio. Um diagnóstico não salvo recebe um identificador de rascunho ao gerar o relatório. O compartilhamento depende de ação do usuário, incluindo seus dados de veículo.

## Conteúdo e regras

A base inicial possui 15 sintomas, oito etapas, 16 fichas de componentes, nove DTCs genéricos, 13 hipóteses, oito instrumentos e glossário. Inclui anéis coletores, rotor, isolamento, desacopladora e B+. Preserva o catálogo, imagens, animações e controles de voz anteriores.

Não há valores universais de aprovação preenchidos. O exemplo 13,8–14,5 V é explicativo, nunca uma regra. Uma referência precisa estar associada à aplicação e ao procedimento. A origem aparece como cadastro administrativo ou informação do técnico; associar um link não certifica sua autenticidade.

O interpretador diferencia desconhecido, fora da referência e compatível nas condições registradas. Quedas sob carga exigem registro de corrente, consumidores e rotação; ripple exige método compatível e configuração do instrumento. Os limites de ripple são em V; medições em mV são convertidas antes da comparação. AC RMS e pico a pico não são intercambiáveis. Corrente depende da demanda, SOC, temperatura, rotação e gerenciamento. Para outra arquitetura elétrica, a análise encaminha a procedimento especializado e não estabelece causa confirmada.

Cada hipótese possui ID, sintomas, testes obrigatórios/opcionais, evidências favoráveis/contrárias, critérios de confirmação/descarte e fonte de consulta. Confirmação exige ensaio reprovado descrito, condições, referência associada e exclusão de causas externas quando aplicável. Hipóteses de resistência/consumo requerem também a medição correspondente. Evidências contraditórias não confirmam nem descartam automaticamente uma hipótese. Não há percentuais de probabilidade.

Gráficos de tensão e corrente usam somente medições digitadas, identificadas como ensaios distintos. As formas de onda normal/diodo aberto/curto/assimetria são sintéticas, com escala relativa e sem limite de aprovação; sua seleção não modifica hipóteses. O circuito de quedas mostra o voltímetro em paralelo, seleção do caminho positivo/negativo e fluxo animado opcional. Nenhum desenho define pinagem de alternador inteligente.

DTCs: P0560, P0562, P0563, P0620, P0621, P0622, P0625, P0626 e P2503. As definições são pontos de partida genéricos OBD; módulo, freeze frame, condições e documentação da aplicação devem ser conferidos. Um DTC isolado não condena o alternador.

## Referências e imagens

Os portais DENSO, Bosch, Valeo, SEG Automotive e o catálogo SAE/J2012 são pontos de consulta, com aplicabilidade e data não informada quando não disponível. Não foram inventadas especificações de montadoras nem alegada consulta a manuais protegidos. O acesso externo aos portais consultados não foi possível pelo proxy desta execução; nenhuma tabela OEM foi extraída ou certificada. O cadastro inicial de aplicações específicas está vazio e apresenta “Valor de referência do fabricante não confirmado”.

As 16 imagens e a vista explodida reutilizam os arquivos locais existentes. Os instrumentos possuem esquemas didáticos e instruções de conexão; novas fotografias reais licenciadas não foram obtidas nesta execução. O cadastro administrativo aceita URLs de materiais e registra fonte/titular/licença, aplicação e revisão para incorporar referências fornecidas pela oficina.

## Armazenamento e administração

`/admin/diagnostico-alternador` exige ADMIN. Editores e visitantes não podem editar a base. O formulário cadastra aplicações/limites, falhas, testes, imagens, diagramas, boletins, DTCs, vídeos e procedimentos, como rascunhos ou publicações. Campos estruturados são validados; os registros publicados ficam disponíveis para consulta na central. Regras de confirmação continuam em código auditável, sem executar expressões fornecidas por visitantes.

A migração aditiva `202611100001_alternator_diagnostics` cria:

- `DiagnosticCase`: proprietário com FK para User, documento JSON validado, revisão e datas. O documento contém veículo, sintomas, verificações, medições, referências, DTCs e relatório; não necessita migrar cadastros existentes.
- `DiagnosticTechnicalEntry`: tipo, documento JSON validado, publicação, editor e datas. Conteúdo técnico inicial reside em estruturas TypeScript; aplicações adicionais são cadastradas por administradores.

`/api/diagnostics/alternator` exige autenticação e filtra cada operação pelo proprietário. PUT exige revisão e responde 409 em conflito. GET não expõe casos de outra conta. Escritas exigem origem válida, limite de tamanho, validação e limite de requisições. Referências declaradas administrativas são confrontadas no servidor com o cadastro publicado, inclusive aplicação, limites, método e fonte.

`/api/diagnostics/alternator/references` permite leitura somente de publicações; leitura de rascunhos e escrita exigem ADMIN. Escritas validam origem e registram auditoria. Respostas usam no-store e não expõem mensagens internas do banco. Rascunhos locais usam sessionStorage somente por escolha do usuário e podem ser removidos; em computadores compartilhados, remova o rascunho e encerre a sessão após o uso.

## Arquivos principais

- `src/lib/alternator-diagnosis/content.ts`: sintomas, procedimentos, fichas, DTCs, ferramentas, segurança e fontes.
- `schema.ts`: contrato dos documentos, entradas/unidades e associação da referência.
- `rules.ts`: interpretações, hipóteses e árvore de próximos testes.
- `handlers.ts` e `store.ts`: operações HTTP testáveis e persistência com consultas parametrizadas.
- `report.ts`: composição do relatório sem inventar valores.
- `src/components/alternator-diagnosis/`: interface, gráficos/circuito e administração.
- `src/app/diagnostico/alternador/`, `src/app/api/diagnostics/alternator/` e `src/app/admin/diagnostico-alternador/`: rotas.
- Integração em `alternator-explorer.tsx`, `visual-reference-catalog.tsx`, `[section]/page.tsx`, navegação administrativa e CSS com estilos de impressão próprios.

## Validação e publicação

Passaram 31 testes de dados, regras, persistência e regressão dos módulos existentes. Os testes cobrem dados ausentes, 12/24 V e carga inteligente, limites associados à aplicação, conversão de ripple e incompatibilidade RMS/pico a pico, referência adulterada, dados inválidos, confirmação, contradições, relatório e autorização. PostgreSQL 16 isolado executou a migração e as consultas reais de criação, retomada, propriedade, revisão, exclusão e cascata; os dados de teste são revertidos por transação. Casos HTTP e referências usam guardas injetados nos testes; as rotas de produção reutilizam a autenticação e o controle de origem existentes.

Passaram 12 cenários de navegador em computador e emulação de iPhone 13: etapas, medições, rascunho, salvamento/retomada/conflito, PDF, filtros, DTCs, fichas, links, administração, impressão, ausência de transbordamento e acessibilidade nos dois temas. Os testes de interface simulam as respostas de autenticação/armazenamento; não são uma sessão autenticada contra a produção. O teste adicional WebGL confere sincronização entre controles externos, seleção no visualizador e a ficha. Voz é verificada pela API simulada; não houve audição em aparelho físico. A rota temporária de teste do catálogo/administração é removida antes do commit.

Para repetir a interface num serviço com banco e autenticação, execute `npx playwright test tests/browser/alternator-diagnosis.spec.ts` com `TEST_ADMIN_STORAGE_STATE` apontando para um estado autenticado de ADMIN. Sem esse estado, o cenário administrativo é explicitamente ignorado. Os overrides `ALTERNATOR_DIAGNOSIS_ADMIN_PREVIEW` e `ALTERNATOR_DIAGNOSIS_CATALOG_PREVIEW` permitem apontar para fixtures locais em ambiente de teste. O teste PostgreSQL exige `TEST_ALTERNATOR_DATABASE_URL` com banco local isolado `edson_test`; sem a variável, é ignorado.

TypeScript direcionado e ESLint são executados para os arquivos envolvidos. A validação/geração integral do Prisma e o build completo estão bloqueados localmente pelo HTTP 403 de `binaries.prisma.sh`; a migração foi validada diretamente no PostgreSQL isolado. Não foram usados valores reais de clientes nos testes.

O Render usa `scripts/start-render.sh`, que executa `npm run db:migrate` antes de iniciar o servidor. Publique a imagem nova com **Manual Deploy → Deploy latest commit**, pois Auto-Deploy está desativado. Não é necessária nova variável de ambiente. Confirme migração e saúde do serviço, entre em uma conta para salvar/retomar um diagnóstico e cadastre referências específicas como ADMIN antes de usar limites de uma aplicação real.
