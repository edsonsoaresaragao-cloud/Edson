# Academy — Aulas 03 a 10: preparação editorial

## Estado desta entrega

Foram preparados oito cadastros de aula e a estrutura de biblioteca, leitura, busca e progresso. **As oito aulas continuam em preparação; esta entrega não representa 358 páginas publicadas nem atualização em produção.** As Aulas 01 e 02 mantêm suas rotas próprias.

Sete PDFs, das Aulas 04 a 10, foram importados em diretório privado: **171 de 358 páginas previstas**. O PDF da Aula 03, de 187 páginas, excedeu o limite de download de 32 MiB da ferramenta usada neste atendimento e permanece ausente. Seu cadastro não contém páginas substitutas ou conteúdo inventado.

| Aula      | Rota em `/academy/aulas/`   | Páginas previstas | Importadas | Transcrições conferidas nos dados | Conferidas no overlay disponível |
| --------- | --------------------------- | ----------------: | ---------: | --------------------------------: | -------------------------------: |
| 03        | `guias-visuais-sincronismo` |               187 |          0 |                                 0 |                                0 |
| 04        | `motores-menos-frequentes`  |                61 |         61 |                                 2 |                                2 |
| 05        | `ferramentas-travamento`    |                17 |         17 |                                17 |                               17 |
| 06        | `correias-acessorios`       |                41 |         41 |                                 2 |                                2 |
| 07        | `pecas-orcamento`           |                11 |         11 |                                11 |                               11 |
| 08        | `diagnostico-sincronismo`   |                14 |         14 |                                 4 |                                4 |
| 09        | `valvulas-empenadas`        |                 8 |          8 |                                 3 |                                3 |
| 10        | `torque-cabecote`           |                19 |         19 |                                 3 |                                3 |
| **Total** |                             |           **358** |    **171** |                            **42** |                           **42** |

Os três overlays editoriais foram mesclados nos dados locais: são 42 transcrições conferidas de 171 páginas importadas e 136 questões preparadas. As 129 transcrições restantes aguardam revisão integral. As revisões `work/library-review/review-04-06.json`, `review-05-07.json` e `review-08-10.json` não são aplicadas automaticamente quando apenas copiadas: a mesclagem exige o script explícito abaixo. A conferência de uma questão não aprova o documento inteiro; questões referentes a páginas pendentes não são liberadas como atividade definitiva.

Todos os documentos permanecem com `technicalReview: "pending"`. Mesmo as Aulas 05 e 07, cujas transcrições já foram conferidas integralmente, aguardam revisão técnica do conjunto. As páginas restantes contêm rascunhos OCR, com possíveis erros de números, códigos, unidades, ordem e completude. Esses rascunhos não são referência técnica definitiva.

O responsável confirmou neste atendimento, em 15/11/2026, a autorização para reproduzir, adaptar e publicar os oito novos PDFs. O registro em `src/lib/academy/library/authorization.json` contém `confirmed: true` e escopo das Aulas 03 a 10. A declaração não representa verificação independente de contrato nem aprovação técnica dos documentos. **Nenhum cabeçalho dos novos PDFs ou imagens foi adaptado nesta preparação.**

## Arquivos preservados e importação

Materiais: `academy-materials/library/aula-03` a `aula-10`, fora de `public`. Dados usados pelo servidor: `src/lib/academy/library/data/aula-03.json` a `aula-10.json`. Após a autorização, os dois diretórios acompanham o projeto e o pacote de implantação. Permanecem fora de `public`; a prévia de material pendente exige ADMIN/EDITOR e a liberação para alunos depende dos demais critérios de publicação. `work/library-review` contém apoio editorial e não deve ser tratado como conteúdo publicado.

Para cada PDF recebido, a importação mantém `original.pdf` como cópia binária, extrai `pagina-NNN.jpg` da imagem JPEG nativa e cria uma prévia `preview-NNN.webp`. As páginas integrais medem 1024 × 1536 pixels; as prévias medem 640 × 960 e servem somente ao carregamento inicial. As imagens integrais não sofreram recorte nem nova compressão. Os manifestos registram SHA-256, dimensões, comparação dos pixels com a renderização do PDF e `headerModified: false`.

O relatório existente `work/library-review/asset-integrity-report.json` registra 171 comparações de pixels, hashes dos sete PDFs e das imagens/prévias válidos, cabeçalhos preservados e `fullSetReady: false`. Esse resultado verifica os arquivos importados; não verifica a correção técnica ou a transcrição. `import-guard-report.json` registra reimportação idempotente, rejeição de fonte diferente e de página ausente, preservação dos originais e dos metadados editoriais, com 349 arquivos binários comparados.

A preparação requer Python com PyMuPDF e Pillow, além do Tesseract com os idiomas utilizados. Esses programas não são dependências de execução no Render. O script procura recursivamente os nomes exatos dos oito anexos definidos em `SOURCES`, verifica a quantidade de páginas e rejeita fonte original diferente. Execute a partir da raiz do projeto:

```sh
python scripts/academy/import-library-material.py \
  --source-dir /workspace/attachments \
  --ocr-language por+eng
```

`--output`, `--editorial` e `--review-dir` permitem apontar diretórios isolados para uma conferência. O cache OCR inclui idioma e hash da imagem. A importação só cria o JSON editorial quando ele ainda não existe, preservando revisões existentes; importar novamente não atualiza automaticamente o OCR já revisado. Todo texto novo começa com `review: "pending"` e todo documento com revisão técnica pendente.

Para conferir somente os arquivos e regenerar o relatório:

```sh
python scripts/academy/import-library-material.py --verify-only
python scripts/academy/import-library-material.py --verify-only --require-all
```

O segundo comando deve falhar enquanto faltar a Aula 03: 171 páginas não satisfazem o requisito de 358. A importação desse PDF ainda precisa ser concluída a partir de uma cópia completa disponível localmente, mantendo o nome de fonte esperado. Não se deve preencher a lacuna com resumos ou páginas de outro documento.

Mescle apenas revisões explicitamente conferidas:

```sh
python scripts/academy/apply-library-review.py \
  work/library-review/review-04-06.json \
  work/library-review/review-05-07.json \
  work/library-review/review-08-10.json
```

A mesclagem atualiza as páginas por número, preserva imagens/hashes e permite títulos, transcrição, descrição acessível, aplicação, guias/partes, assuntos, explicações do professor, notas e questões. Cada overlay substitui o banco de questões da aula quando contém `questions`; overlays futuros devem preservar as questões desejadas. A conferência de texto não substitui a aprovação técnica: sem `technicalReview` explícito, o script mantém `pending`. Não há aprovação automática do OCR.

## Biblioteca e estudo

A biblioteca em `/academy/aulas` apresenta os oito títulos com estado de preparação. O público pode consultar a apresentação e as contagens; o conteúdo-fonte, as questões e os materiais ainda pendentes só ficam disponíveis na prévia de ADMIN/EDITOR autenticado. A prévia não libera matrícula, conclusão ou certificado. Os endpoints recusam o estudo de documentos não publicados, mesmo que o cliente tente enviar uma ação diretamente.

A sala preparada permite pesquisar texto, motor, modelo, guia, ferramenta ou DTC, filtrar por montadora/assunto, abrir uma página pelo número e consultar partes relacionadas. Metadados e relações dependem da conferência editorial. O visualizador carrega inicialmente a prévia da página selecionada, oferece resolução original, zoom de 50% a 300%, ampliação em diálogo, imagem integral e PDF completo. O original e os créditos permanecem identificados como Ponto do Motor. A rota aceita apenas nomes conhecidos da aula; os arquivos não são expostos em `public`.

Há modos separados de **Leitura original** e **Explicação do professor**, com voz em português disponível no dispositivo, velocidades de 0,75×, 1×, 1,25× e 1,5×, pausa, continuação, parada, repetição e indicação do trecho atual. O texto de rascunho só pode ser ouvido na prévia editorial, com aviso explícito de OCR não conferido. Não há reprodução automática, clonagem de voz ou conclusão por ouvir. As explicações da EDSON OFICINA permanecem separadas da fonte; disponibilizar essas explicações na prévia não significa aprovação técnica do documento.

A atividade de orçamento da Aula 07 organiza um rascunho na sessão, com componente/aplicação, decisão, justificativa, quantidade, preço informado pelo aluno, mão de obra e origem da cotação. Campos sem preço ficam a cotar. Não inventa preços, não grava esse rascunho como progresso e não certifica um reparo.

## Conta, avaliações e certificado

O fluxo reutiliza a autenticação, cursos, matrículas e progresso existentes. A instalação idempotente e a matrícula ocorrem pela ação explícita **Iniciar aula**, depois que o material atende aos critérios de publicação. GET não matricula. O servidor valida origem, sessão, limite de requisições e formato estrito, calcula a nota e recusa identidade ou nota declaradas pelo cliente.

As etapas representam páginas estudadas e avaliação final; não são etapas de execução de reparo. A Aula 05 possui 18 etapas de estudo: 17 páginas e uma avaliação. A conclusão de cada página exige confirmação de estudo, além das questões disponíveis; a avaliação exige as páginas concluídas. O mínimo de aprovação é 70%. Posição, melhor resultado e conclusões pertencem à matrícula; tentativas e respostas são registradas em `AcademyAttempt` no PostgreSQL. Nova tentativa reprovada não apaga aprovação anterior. Ouvir ou abrir uma imagem não produz conclusão.

A migração `202611140002_academy_library` adiciona as tentativas e permite a carga horária pendente somente nos IDs estáveis previstos. O catálogo mostra **Carga horária a validar pelo responsável**; o zero interno não é apresentado como carga válida. O fluxo bloqueia emissão de certificado dessas aulas até que sua carga horária seja validada. A preparação não atribui horas de curso nem habilita certificados por conta própria.

## Verificação e publicação posterior

Há testes de serviço para catálogo, bloqueios de publicação, correção, progresso e tentativas; testes de integridade usam arquivos sintéticos para verificar hashes, substituições, ausência e nomes de arquivo. Os testes de navegador cobrem os estados públicos de preparação e proteção. O fluxo autenticado usa PostgreSQL local isolado chamado `academy_library` e substitui temporariamente a Aula 05 por uma fixture sintética de 17 páginas, com restauração ao terminar. Ele testa 18 etapas e tentativas independentes entre contas; esse exercício não valida os procedimentos reais dos PDFs. A síntese de voz é simulada para testar os controles e a sequência, sem comprovar áudio real no dispositivo.

O workflow `.github/workflows/academy-library.yml` prepara o PostgreSQL, gera o Prisma, aplica migrações, executa testes, build e verificações de navegador com regressão das Aulas 01 e 02. A existência do workflow não comprova sua execução. O resultado efetivo dos comandos locais e do CI deve ser registrado separadamente, com seus bloqueios; esta documentação não declara build, CI ou deploy aprovados.

Para publicar uma aula, ainda são necessários:

1. PDF completo e páginas corretas, na ordem e na quantidade previstas.
2. Autorização específica registrada em `authorization.json`, com escopo da aula e declaração do responsável — confirmada neste atendimento para as Aulas 03 a 10.
3. Todas as transcrições e descrições conferidas, revisão técnica integral aprovada e questões verificadas contra suas páginas de origem, incluindo pelo menos dez perguntas finais.
4. Nomes fixos e hashes completos de PDF, páginas e prévias, com verificação dos arquivos reais. A aplicação volta a conferir a identidade dos arquivos ao consultar a prontidão.
5. Carga horária validada para emissão de certificado, além dos demais requisitos de conclusão.
6. Testes/build concluídos e implantação conferida no ambiente de destino.

A estratégia de entrega dos materiais é uma fonte privada completa: PDFs, imagens, prévias e JSONs editoriais precisam existir no contexto do build autorizado, nos caminhos acima. `scripts/prepare-standalone.mjs` copia `academy-materials`, os dados editoriais disponíveis e `authorization.json` ao artefato standalone, sempre fora dos assets públicos. Ele não importa PDFs nem baixa materiais de um serviço remoto.

Os sete PDFs recebidos, as 171 imagens integrais, as 171 prévias e seus dados editoriais agora acompanham o repositório autorizado e são copiados para o standalone durante o build. O envio não depende dos links temporários dos anexos. Os arquivos são materiais-fonte para conferência; sua presença no projeto não libera uma aula com revisão pendente. A Aula 03 permanece registrada como ausente, sem PDF ou páginas substitutas.

Depois das revisões e verificações restantes, conferir o workflow e executar no Render **Manual Deploy → Deploy latest commit** com a fonte privada disponível ao build. O startup aplica as migrações existentes antes de iniciar o serviço. Após implantar, conferir biblioteca, login, restrição editorial, arquivos completos, retomada, avaliação e voz no dispositivo. Arquivos locais, commits e testes sintéticos não constituem uma publicação em produção.
