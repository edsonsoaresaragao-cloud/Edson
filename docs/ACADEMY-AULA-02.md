# Aula 02 — Conferência final antes de dar partida

## Conteúdo e integração

Rota: `/academy/aulas/conferencia-final`. A aula aparece em `/academy/aulas`, no botão **Aulas organizadas** e nos treinamentos da Academy. Seus links em Meus cursos e no catálogo apontam à mesma sala de estudo. A Aula 01, seus catorze passos, arquivos, controles de voz e serviços de progresso permanecem nos arquivos existentes.

São cinco etapas: Introdução, Correia seca, Correia em óleo, Corrente e Avaliação final. Os três módulos contêm sete pontos cada, totalizando 21 pontos e 45 linhas de condições/alertas. Há duas perguntas de fixação por sistema e dez perguntas finais, com correção no servidor e mínimo de 70%. Explicações da EDSON OFICINA ficam identificadas separadamente da referência Ponto do Motor. Não foram criados valores de torque, ângulo, óleo ou cura.

Os arquivos `index.html`, PNGs e PDF adaptado mencionados no pedido não foram anexados. A preparação usa o PDF original recebido, com transcrição manual conferida nas quatro páginas e adaptação documental restrita aos cabeçalhos superiores.

## Material preservado

Diretório: `academy-materials/aula-02`, fora de `public`.

- `original.pdf`: cópia binária do anexo `1793833551078-bonus-06-checklist-conferencia-final.pdf`, SHA-256 `1ef65233b118f5cb0e9df54e9c728e2279c362346444580f4c4abffcef028274`.
- `Aula_02_Conferencia_Final_sem_Bonus_no_Cabecalho.pdf`: arquivo separado de quatro páginas, com **AULA 02** somente no lugar de **BÔNUS 06** nos cabeçalhos superiores.
- `pagina-01.png` a `pagina-04.png`: páginas completas, em 1024 × 1536 pixels, sem recorte ou redução da resolução nativa. As imagens são renderizações do PDF adaptado.
- `manifest.json`: hashes, dimensões, retângulos de cabeçalho e comparação de pixels. Todos os pixels fora dos retângulos, com margem de antialiasing de dois pixels, são iguais aos do original. O PDF salvo foi reaberto e suas renderizações conferidas contra os quatro PNGs.

Logotipos, fotografias, legendas, sinais, avisos e rodapés foram preservados, inclusive **Bônus 06** nas referências inferiores. Os rodapés citam O Mecânico (Fire 1.0; TU5JP4/EC5JP4), O Mecânico (Onix CSS Prime, 2024) e a regra geral de sistemas de corrente, conforme as respectivas páginas.

Reprodução editorial com PyMuPDF e Pillow, sem dependências Python no Render:

```sh
python scripts/academy/adapt-checklist-material.py caminho/1793833551078-bonus-06-checklist-conferencia-final.pdf
```

O script confere o hash do anexo antes de copiar, preserva o original e valida alterações apenas nas regiões superiores indicadas. O empacotamento standalone existente já inclui todo o diretório `academy-materials`.

## Leitura por página

Cada uma das quatro etapas com imagem possui **Ouvir esta página**, **Pausar**, **Continuar**, **Parar**, seleção de voz pt-BR e velocidades 0,8×, 1×, 1,2× e 1,4×. O início exige clique; não há reprodução automática nem conclusão de estudo ao ouvir.

`sourcePages` e `pageTranscript`, em `src/lib/academy/checklist/content.ts`, contêm a transcrição editável. Ela inclui os 21 pontos, todas as 45 linhas, a legenda de sinais, condições de liberação e créditos de cada página. O navegador não executa OCR. **Ver texto que será narrado** mantém o conteúdo acessível sem voz pt-BR ou sem Web Speech API.

A fala é segmentada em até 180 caracteres, com índice e status acessível. A próxima parte depende de `onend`. Navegar, ocultar/sair da página ou desmontar o leitor cancela a sessão e os temporizadores; eventos antigos não iniciam novas falas. O leitor novo também cancela sessões anteriores ao iniciar. Os componentes de voz da Aula 01 não foram alterados. As vozes vêm do dispositivo, sem clonagem pessoal ou chave externa.

## Conta, estudo e avaliação

Usa a autenticação atual e os modelos `Course`, `Module`, `Lesson`, `Question`, `Enrollment` e `Progress`; não há sistema paralelo de alunos nem nova migração. O curso `academy-aula-02-conferencia-final-v1` é instalado idempotentemente na primeira ação **Iniciar aula**. O GET nunca matricula. Uma edição despublicada pelo responsável não é reinstalada ou sobrescrita.

`POST /api/academy/aula-02/progress` verifica origem, sessão, limite por conta e formato estrito; ignora qualquer alegação de identidade ou nota do cliente recusando campos desconhecidos. O servidor confere os IDs dos sete pontos da etapa e calcula a avaliação. Aprovações e melhor nota são gravadas no PostgreSQL; posição e data de visita permitem retomar. Somente as cinco etapas aprovadas produzem 100%.

As caixas indicam **pontos estudados**, sem certificar execução de um reparo. Marcações parciais ficam na sala aberta; a aprovação da etapa, sua nota e posição de estudo são os registros persistentes. Uma etapa concluída reabre com os pontos marcados. Não foi usado localStorage para simular progresso de conta.

Enquanto a carga horária não for validada pelo responsável, a interface mostra **Carga horária a validar**. O cadastro legado exige um inteiro, portanto zero é usado internamente como pendência, sem apresentar “0 horas”. Uma proteção restrita ao novo ID impede emitir certificado dessa aula nessa situação; certificados e regras da Aula 01 continuam funcionando como antes. Uma validação editorial posterior pode preencher apenas o valor pendente, preservando horas já definidas.

O material adaptado é entregue por uma lista fechada de nomes em `/api/academy/aula-02/material/[file]`. O original só pode ser obtido por ADMIN/EDITOR autenticado para conferência editorial. Arquivos arbitrários e o manifesto não são expostos por essa rota.

## Validação e publicação

Os testes unitários cobrem transcrições integrais, 21 pontos, hashes, resolução, quatro páginas dos PDFs, correção, 60%/70%, progressos separados e entrega de arquivos. Os testes de navegador cobrem as quatro leituras, pausa/continuação/parada, erros, troca de página, velocidades, ausência de voz, transcrição, imagens reais, zoom, teclado, download e acessibilidade. A síntese de voz é simulada para verificar chamadas e controle de sequência; ouvir áudio no dispositivo depende de suas vozes instaladas.

Os testes locais de interação do progresso usam um repositório controlado em memória conectado ao mesmo serviço de correção, sem alegar persistência PostgreSQL a partir dessa simulação. O teste `academy-checklist-auth.spec.ts` foi preparado para o workflow `Academy Aula 02`: ele exige um banco local isolado chamado `academy_checklist`, cria contas de teste, verifica login real, os cinco registros persistidos, retomada, separação entre alunos e a recusa de notas forjadas e de certificado sem horas validadas. O workflow também gera o Prisma, aplica migrações, executa o build e a regressão de leitura da Aula 01.

Resultado local: 17 testes unitários passaram; os 12 casos de navegador da Aula 02 e os seis casos de leitura da Aula 01 passaram em desktop e celular. A verificação TypeScript dos componentes, conteúdo, correção e testes públicos passou, assim como ESLint nos arquivos alterados. A sala de estudo não apresentou violações no axe nem rolagem horizontal nos testes de visualização.

O build foi tentado nesta preparação e parou na geração do Prisma: o download do schema-engine em `binaries.prisma.sh` retornou HTTP 403 neste ambiente. Nenhum cliente Prisma falso ou alteração de verificação de checksum foi incluído. O build completo e o teste autenticado PostgreSQL são executados no workflow `Academy Aula 02` após o envio ao repositório. O resultado desse workflow deve ser conferido antes da implantação no Render; as verificações locais acima não substituem essa execução.

Comandos locais:

```sh
npx tsx --test tests/academy-checklist.test.ts tests/academy.test.ts tests/academy-narration.test.ts
TEST_BASE_URL=http://localhost:3100 npx playwright test tests/browser/academy-checklist.spec.ts tests/browser/academy-reader.spec.ts
```

**Autorização registrada:** o responsável confirmou neste atendimento que a autorização do titular também abrange a reprodução, adaptação e publicação do PDF deste checklist da Aula 02. Essa declaração consta no manifesto e no script de preparação. Trata-se da confirmação do responsável, sem verificação independente de contrato.

Na publicação, enviar a alteração ao repositório e acompanhar o workflow `Academy Aula 02`. No Render, executar **Manual Deploy → Deploy latest commit**, pois não há acesso ao deploy pelas ferramentas deste atendimento. Conferir a biblioteca, matrícula, retomada e leitura no dispositivo após implantar. Não afirmar que o site foi atualizado apenas porque os arquivos foram preparados ou enviados ao GitHub.
