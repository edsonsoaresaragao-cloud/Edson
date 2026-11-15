# Academy — Aulas 03 a 10: preparação editorial

## Estado desta entrega

Foram preparados oito cadastros de aula e a estrutura de biblioteca, leitura, busca e progresso. **As páginas recebidas das Aulas 04 a 10 podem ser visualizadas após a autorização, mesmo durante a revisão didática. A Aula 03 possui agora as 187 páginas e dois PDFs para download; avaliações e conclusão dependem da revisão integral. São 358 páginas importadas; esta entrega não representa atualização automática em produção.** As Aulas 01 e 02 mantêm suas rotas próprias.

Os oito PDFs foram importados em diretório privado: **358 de 358 páginas previstas**. A Aula 03 foi obtida integralmente do Google Drive e dividida em **Parte 1, páginas 1–94**, e **Parte 2, páginas 95–187**. O original de 187 páginas também foi preservado. As 187 páginas das partes foram comparadas pixel a pixel com o original, sem diferenças. Os links das duas partes aparecem no visualizador da Aula 03. A importação não adicionou transcrições automáticas nem aprovação técnica.

| Aula      | Rota em `/academy/aulas/`   | Páginas previstas | Importadas | Transcrições conferidas nos dados | Conferidas no overlay disponível |
| --------- | --------------------------- | ----------------: | ---------: | --------------------------------: | -------------------------------: |
| 03        | `guias-visuais-sincronismo` |               187 |        187 |                                 0 |                                0 |
| 04        | `motores-menos-frequentes`  |                61 |         61 |                                 2 |                                2 |
| 05        | `ferramentas-travamento`    |                17 |         17 |                                17 |                               17 |
| 06        | `correias-acessorios`       |                41 |         41 |                                 2 |                                2 |
| 07        | `pecas-orcamento`           |                11 |         11 |                                11 |                               11 |
| 08        | `diagnostico-sincronismo`   |                14 |         14 |                                 4 |                                4 |
| 09        | `valvulas-empenadas`        |                 8 |          8 |                                 3 |                                3 |
| 10        | `torque-cabecote`           |                19 |         19 |                                 3 |                                3 |
| **Total** |                             |           **358** |    **358** |                            **42** |                           **42** |

Os três overlays editoriais foram mesclados nos dados locais: são 42 transcrições conferidas de 358 páginas importadas e 136 questões preparadas. As 129 transcrições existentes restantes e as 187 páginas da Aula 03 aguardam revisão integral; a Aula 03 ainda não possui transcrição. As revisões `work/library-review/review-04-06.json`, `review-05-07.json` e `review-08-10.json` não são aplicadas automaticamente quando apenas copiadas: a mesclagem exige o script explícito abaixo. A conferência de uma questão não aprova o documento inteiro; questões referentes a páginas pendentes não são liberadas como atividade definitiva.

Todos os documentos permanecem com `technicalReview: "pending"`. Mesmo as Aulas 05 e 07, cujas transcrições já foram conferidas integralmente, aguardam revisão técnica do conjunto. As páginas restantes das Aulas 04 a 10 contêm rascunhos OCR, com possíveis erros de números, códigos, unidades, ordem e completude. Esses rascunhos não são referência técnica definitiva.

O responsável confirmou neste atendimento, em 15/11/2026, a autorização para reproduzir, adaptar e publicar os oito novos PDFs. O registro em `src/lib/academy/library/authorization.json` contém `confirmed: true` e escopo das Aulas 03 a 10. A declaração não representa verificação independente de contrato nem aprovação técnica dos documentos. **Nenhum cabeçalho dos novos PDFs ou imagens foi adaptado nesta preparação.**

## Arquivos preservados e importação

Materiais: `academy-materials/library/aula-03` a `aula-10`, fora de `public`. Dados usados pelo servidor: `src/lib/academy/library/data/aula-03.json` a `aula-10.json`. Após a autorização, os dois diretórios acompanham o projeto e o pacote de implantação. Permanecem fora de `public`; a consulta aos originais exige autorização e integridade dos arquivos. Transcrições pendentes permanecem identificadas como rascunho; avaliação, progresso e certificados seguem os critérios de publicação didática. `work/library-review` contém apoio editorial e não deve ser tratado como conteúdo publicado.

Para cada PDF recebido, a importação mantém `original.pdf` como cópia binária, extrai `pagina-NNN.jpg` da imagem JPEG nativa e cria uma prévia `preview-NNN.webp`. As páginas integrais medem 1024 × 1536 pixels; as prévias medem 640 × 960 e servem somente ao carregamento inicial. As imagens integrais não sofreram recorte nem nova compressão. Os manifestos registram SHA-256, dimensões, comparação dos pixels com a renderização do PDF e `headerModified: false`.

O relatório `work/library-review/asset-integrity-report.json` registra 358 comparações de pixels, hashes dos oito PDFs e das imagens/prévias válidos, cabeçalhos preservados e `fullSetReady: true`. Esse resultado verifica os arquivos importados; não verifica a correção técnica ou a transcrição. A divisão da Aula 03 tem adicionalmente 187 comparações visuais registradas em seu manifesto.

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

O segundo comando agora confere o conjunto completo de 358 páginas. Para importar e dividir especificamente a Aula 03, execute `python scripts/academy/import-aula-03.py /caminho/original.pdf`. O script preserva a cópia integral, os créditos e as revisões existentes, compara todas as páginas das partes com a fonte e registra hashes em `pdfParts`.

Mescle apenas revisões explicitamente conferidas:

```sh
python scripts/academy/apply-library-review.py \
  work/library-review/review-04-06.json \
  work/library-review/review-05-07.json \
  work/library-review/review-08-10.json
```

A mesclagem atualiza as páginas por número, preserva imagens/hashes e permite títulos, transcrição, descrição acessível, aplicação, guias/partes, assuntos, explicações do professor, notas e questões. Cada overlay substitui o banco de questões da aula quando contém `questions`; overlays futuros devem preservar as questões desejadas. A conferência de texto não substitui a aprovação técnica: sem `technicalReview` explícito, o script mantém `pending`. Não há aprovação automática do OCR.

## Biblioteca e estudo

A biblioteca em `/academy/aulas` destaca primeiro as aulas que possuem arquivos autorizados e íntegros. As Aulas 03 a 10 exibem **Visualizar aula**, com páginas, PDF completo, zoom, busca e leitura. Essa consulta não depende da aprovação didática. A Aula 03 exibe as 187 páginas, as duas partes com seus intervalos e o original completo. Autorização ausente, arquivos alterados ou incompletos continuam impedindo a consulta pública. ADMIN/EDITOR conserva a prévia editorial restrita. As avaliações só são enviadas ao navegador quando a aula está liberada para estudo ou o acesso é editorial; endpoints de matrícula/conclusão continuam exigindo a revisão didática completa.

A sala preparada permite pesquisar texto, motor, modelo, guia, ferramenta ou DTC, filtrar por montadora/assunto, abrir uma página pelo número e consultar partes relacionadas. Metadados e relações dependem da conferência editorial. O visualizador carrega inicialmente a prévia da página selecionada, oferece resolução original, zoom de 50% a 300%, ampliação em diálogo, imagem integral e PDF completo. O original e os créditos permanecem identificados como Ponto do Motor. A rota aceita apenas nomes conhecidos da aula; os arquivos não são expostos em `public`.

Há modos separados de **Leitura original** e **Explicação do professor**, com voz em português disponível no dispositivo, velocidades de 0,75×, 1×, 1,25× e 1,5×, pausa, continuação, parada, repetição e indicação do trecho atual. O texto de rascunho pode ser ouvido na consulta autorizada, sempre identificado como **Ouvir rascunho desta página**, com aviso explícito de OCR não conferido. Não há reprodução automática, clonagem de voz ou conclusão por ouvir. As explicações da EDSON OFICINA permanecem separadas da fonte; disponibilizar essas explicações na prévia não significa aprovação técnica do documento.

A atividade de orçamento da Aula 07 organiza um rascunho na sessão, com componente/aplicação, decisão, justificativa, quantidade, preço informado pelo aluno, mão de obra e origem da cotação. Campos sem preço ficam a cotar. Não inventa preços, não grava esse rascunho como progresso e não certifica um reparo.

## Conta, avaliações e certificado

O fluxo reutiliza a autenticação, cursos, matrículas e progresso existentes. A instalação idempotente e a matrícula ocorrem pela ação explícita **Iniciar aula**, depois que o material atende aos critérios de publicação. GET não matricula. O servidor valida origem, sessão, limite de requisições e formato estrito, calcula a nota e recusa identidade ou nota declaradas pelo cliente.

As etapas representam páginas estudadas e avaliação final; não são etapas de execução de reparo. A Aula 05 possui 18 etapas de estudo: 17 páginas e uma avaliação. A conclusão de cada página exige confirmação de estudo, além das questões disponíveis; a avaliação exige as páginas concluídas. O mínimo de aprovação é 70%. Posição, melhor resultado e conclusões pertencem à matrícula; tentativas e respostas são registradas em `AcademyAttempt` no PostgreSQL. Nova tentativa reprovada não apaga aprovação anterior. Ouvir ou abrir uma imagem não produz conclusão.

A migração `202611140002_academy_library` adiciona as tentativas e permite a carga horária pendente somente nos IDs estáveis previstos. O catálogo mostra **Carga horária a validar pelo responsável**; o zero interno não é apresentado como carga válida. O fluxo bloqueia emissão de certificado dessas aulas até que sua carga horária seja validada. A preparação não atribui horas de curso nem habilita certificados por conta própria.

## Verificação e publicação posterior

Há testes de serviço para catálogo, bloqueios de publicação, correção, progresso e tentativas; testes de integridade usam arquivos sintéticos para verificar hashes, substituições, ausência e nomes de arquivo. Os testes de navegador cobrem os estados públicos de preparação e proteção. O fluxo autenticado usa PostgreSQL local isolado chamado `academy_library` e substitui temporariamente a Aula 05 por uma fixture sintética de 17 páginas, com restauração ao terminar. Ele testa 18 etapas e tentativas independentes entre contas; esse exercício não valida os procedimentos reais dos PDFs. A síntese de voz é simulada para testar os controles e a sequência, sem comprovar áudio real no dispositivo.

O workflow `.github/workflows/academy-library.yml` prepara o PostgreSQL, gera o Prisma, aplica migrações, executa testes, build e verificações de navegador com regressão das Aulas 01 e 02. A existência do workflow não comprova sua execução. O resultado efetivo dos comandos locais e do CI deve ser registrado separadamente, com seus bloqueios; esta documentação não declara deploy realizado. Os testes públicos conferem as imagens reais e a leitura das aulas recebidas, a navegação/zoom, os dois downloads da Aula 03 e a separação entre consulta e conclusão.

Para publicar uma aula, ainda são necessários:

1. PDF completo e páginas corretas, na ordem e na quantidade previstas.
2. Autorização específica registrada em `authorization.json`, com escopo da aula e declaração do responsável — confirmada neste atendimento para as Aulas 03 a 10.
3. Todas as transcrições e descrições conferidas, revisão técnica integral aprovada e questões verificadas contra suas páginas de origem, incluindo pelo menos dez perguntas finais.
4. Nomes fixos e hashes completos de PDF, páginas e prévias, com verificação dos arquivos reais. A aplicação volta a conferir a identidade dos arquivos ao consultar a prontidão.
5. Carga horária validada para emissão de certificado, além dos demais requisitos de conclusão.
6. Testes/build concluídos e implantação conferida no ambiente de destino.

A estratégia de entrega dos materiais é uma fonte privada completa: PDFs, imagens, prévias e JSONs editoriais precisam existir no contexto do build autorizado, nos caminhos acima. `scripts/prepare-standalone.mjs` copia `academy-materials`, os dados editoriais disponíveis e `authorization.json` ao artefato standalone, sempre fora dos assets públicos. Ele não importa PDFs nem baixa materiais de um serviço remoto.

Os oito PDFs recebidos, as duas partes da Aula 03, as 358 imagens integrais, as 358 prévias e seus dados editoriais agora acompanham o repositório autorizado e são copiados para o standalone durante o build. O envio não depende dos links temporários dos anexos. Os arquivos são materiais-fonte autorizados para consulta; sua presença no projeto não aprova avaliações nem libera conclusão de uma aula com revisão pendente. A Aula 03 está integralmente importada, com transcrição e revisão técnica pendentes.

Depois das revisões e verificações restantes, conferir o workflow e executar no Render **Manual Deploy → Deploy latest commit** com a fonte privada disponível ao build. O startup aplica as migrações existentes antes de iniciar o serviço. Após implantar, conferir biblioteca, login, restrição editorial, arquivos completos, retomada, avaliação e voz no dispositivo. Arquivos locais, commits e testes sintéticos não constituem uma publicação em produção.

## Conferência da divisão da Aula 03

Fonte: https://drive.google.com/file/d/1xxF2H2M89McUnbC_FCKvuBOYbUM2vYZj/view

O manifesto registra os hashes do original e das duas partes, com 94 e 93 páginas, e 187 comparações visuais bem-sucedidas. As imagens integrais e prévias também passaram na verificação do conjunto de 358 páginas. A autorização existente foi reutilizada sem alteração. As partes são verificadas por hash pelo mesmo controle de integridade dos demais materiais; intervalos ausentes, sobrepostos ou incompletos não liberam a consulta.
