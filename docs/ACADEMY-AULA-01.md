# Academy — Aula 01: motores que batem válvula

## Acesso e programa

Fluxo: `/academy` → **Aulas organizadas** → `/academy/aulas` → `/academy/aulas/motores-que-batem-valvula` → **Iniciar aula**.

A biblioteca e o conteúdo podem ser consultados sem conta. Início, posição de estudo, conclusão e avaliações exigem a autenticação atual da Academy. Uma consulta GET nunca cria matrícula nem progresso. O curso passa a constar também em **Meus cursos** depois da matrícula; seu link abre a nova sala de estudo.

São 14 etapas: introdução, fundamentos, Volkswagen, Chevrolet, Fiat/Jeep, Ford, Renault/Nissan, Peugeot/Citroën, Toyota, Honda, Hyundai/Kia, Mitsubishi, diagnóstico e avaliação. Dez perguntas de fixação (uma por montadora) e dez perguntas finais têm correção no servidor e explicações após o envio. Não é necessário manter a página aberta para ter progresso; é necessário concluir explicitamente cada etapa e ser aprovado.

Carga horária editorial definida: **4 horas**. Programa: introdução 10 min, fundamentos 40 min, montadoras 120 min, diagnóstico 30 min, avaliação 20 min e revisão 20 min. É uma carga de estudo prevista, não uma medição automática de presença.

## Material e autorização

O responsável pelo site confirmou explicitamente, neste atendimento em 13/11/2026, que tem autorização do titular, incluindo **Ponto do Motor**, para adaptar e publicar o material. Os créditos e as fontes citadas no documento foram preservados. A confirmação do responsável não é apresentada como verificação independente de contrato/licença.

Arquivo fornecido: `1793833549002-bonus-03-mapa-motores-que-batem-valvula.pdf`, 11 páginas, imagens nativas de 1024 × 1536 pixels.

Localização no servidor: `academy-materials/aula-01/`, **fora de `public`**.

- `original.pdf`: cópia binária exata; SHA-256 `429addfbd9ecdb6ba7b867fecab3ee999575df235cc762e2cbbdd90f34e09de9`.
- `aula-01.pdf`: documento separado, com os cabeçalhos adaptados.
- `page-01.png` a `page-11.png`: páginas completas da adaptação em PNG, sem compressão com perdas, redução da resolução nativa ou corte de bordas.
- `manifest.json`: hashes, dimensões, retângulos editados e registro da comparação de pixels.

Adaptação editorial: selo da capa substituído por **AULA 01**; indicação **BÔNUS 03 ·** retirada dos dez cabeçalhos técnicos. Títulos restantes, fotografias, tabelas, numeração, legendas, alertas, dicas e rodapés permanecem. Referências a bônus no corpo/rodapé não foram removidas. A comparação verificou igualdade de todos os pixels fora dos retângulos de cabeçalho (com margem de antialiasing de 2 pixels).

As dez tabelas possuem, respectivamente, 11, 11, 12, 10, 12, 9, 8, 6, 7 e 7 linhas: **93 linhas** preservadas na visualização da fonte. Não foram criadas tabelas digitais por OCR sem conferência. A fonte original e a adaptação foram conferidas visualmente nas onze páginas.

Reprodução editorial opcional, com PyMuPDF e Pillow instalados no ambiente de edição:

```sh
python scripts/academy/adapt-material.py caminho/documento.pdf
```

Essas dependências Python **não são necessárias** no Render ou no build. Os arquivos prontos são incorporados ao artefato standalone por `scripts/prepare-standalone.mjs`.

## Entrega dos arquivos

`GET /api/academy/aula-01/material/[file]` aceita somente os treze nomes conhecidos: onze páginas e dois PDFs. Não aceita caminhos de usuário, manifestos, URLs remotas ou arquivos arbitrários.

Páginas e PDF adaptado podem ser consultados publicamente conforme a autorização recebida. O original só pode ser baixado por ADMIN/EDITOR autenticado, em `/api/academy/aula-01/material/original.pdf`, com `Cache-Control: private, no-store`. Nenhum link público ao original é apresentado ao aluno.

O visualizador permite navegação por todas as páginas em ordem, zoom de 50% a 300%, rolagem para consultar a página inteira, ampliação em diálogo (Esc para fechar) e download do PDF adaptado. Cada módulo abre inicialmente a página correspondente.

## Critérios técnicos

As classificações da fonte foram mantidas; **sem fonte** não se transforma em **confirmado**. As explicações da Academy são identificadas separadamente das páginas e das sínteses dos alertas/dicas da fonte. Nenhum dado de compressão, folga ou torque de fabricante foi inventado.

A fundamentação aborda quatro tempos, pistões, válvulas, comando, virabrequim, relação 2:1, PMS, cruzamento, correia seca, corrente e correia em óleo. O esquema animado é conceitual, sem escala, marcas de reparação ou classificação de um motor real.

O diagnóstico organiza dez verificações. Não orienta partida, rotação independente de eixos ou força contra resistência antes de estabelecer condições seguras. A dica original Ford sobre girar duas voltas é preservada na imagem, com ressalva didática explícita. As notas Honda e Mitsubishi mantêm o alcance específico das aplicações citadas, sem extrapolar a toda a família.

## Persistência e certificado

Não foi criado um sistema paralelo de alunos. Reutiliza `User`, `Course`, `Module`, `Lesson`, `Question`, `Enrollment`, `Progress` e `Certificate`.

- Curso estável: `academy-aula-01-motores-v1`.
- Na primeira ação **Iniciar aula**, é instalado idempotentemente com 14 módulos/etapas e suas questões. Instalação e matrícula não dependem de links temporários ou seed manual de conteúdo.
- O curso já aparece na biblioteca e no catálogo Academy antes da primeira matrícula.
- `Enrollment.lastLessonId` e `lastViewedAt` permitem retomar a posição sem criar conclusão.
- Conclusões pertencem à matrícula do usuário autenticado. IDs de usuário/notas enviados pelo cliente não são aceitos pelo contrato.
- A correção exige respostas válidas para todas as perguntas da etapa. Tentativa abaixo de 70% retorna explicações sem gravar conclusão. Etapas sem questionário exigem o botão de confirmação.
- Progresso é percentual de etapas aprovadas, com deduplicação; visita e navegação não aumentam a porcentagem.
- O certificado usa a ação existente `certificate`, que verifica no servidor aprovação em todas as aulas do curso. A interface só habilita a solicitação com as 14 etapas aprovadas.
- Para esta aula, o PDF traz **certificado de participação**, nome, título, 4 horas, emissão, conclusão e o código verificável atual. A data de conclusão é armazenada separadamente da emissão. Dados pessoais e download seguem a proteção existente.
- Registros anteriores continuam válidos, com `completedAt` opcional. Não há alegação de reconhecimento oficial/acadêmico.

`POST /api/academy/aula-01/progress` usa autenticação, verificação de origem, limite por conta e validação estrita. A avaliação nunca aceita uma nota calculada pelo cliente. O banco de correção não é enviado nos props da sala de estudo.

A instalação não sobrescreve cursos já existentes ou despublicados pelo administrador. Mudanças futuras no programa persistido precisam de uma nova versão ou atualização editorial controlada, não de exclusão dos registros dos alunos.

## Implantação no Render

A migração `202611130001_academy_resume` adiciona dois campos opcionais em Enrollment e um em Certificate. O startup existente executa `prisma migrate deploy` antes de iniciar os serviços. Não é necessária nova chave externa para a aula, PDF, avaliação ou animação; autenticação e PostgreSQL usam a configuração existente.

Depois de enviar o código: **Manual Deploy → Deploy latest commit**. Verifique a migração e o build nos logs, depois faça a matrícula com uma conta real para confirmar persistência e emissão no ambiente implantado.

## Validação realizada

- 8 testes de material/lógica: integridade dos PDFs, onze páginas e dimensões, 93 linhas previstas, início sem conclusão automática, retomada, separação entre usuários, respostas inválidas, limite 60%/70%, elegibilidade após 14 etapas e proteção contra caminhos arbitrários.
- 4 testes Playwright (dois fluxos, computador e celular): biblioteca, páginas reais, zoom e ampliação, download real do PDF adaptado, recusa real de acesso anônimo ao original/progresso, animação, navegação, correção, reprovação, retomada e solicitação de certificado. Nenhum erro JavaScript e nenhum problema detectado pelo axe na sala de estudo.
- No teste de aluno, a persistência utiliza repositório controlado em memória conectado ao mesmo serviço de correção. A emissão é simulada para validar o envio e o tratamento de erro; **não comprova gravação PostgreSQL nem emissão real do PDF de certificado**.
- ESLint passou nos arquivos alterados; TypeScript passou para conteúdo, serviço de correção, componentes de estudo e testes de navegador.
- `npm run db:generate` e `npm run build` foram tentados. O ambiente bloqueia `binaries.prisma.sh` com HTTP 403 ao obter o schema-engine. A geração do cliente, a checagem completa do projeto, o build de produção, a migração PostgreSQL e os fluxos autenticados reais ficaram impedidos por essa dependência. Nenhum Prisma falso foi incluído para contornar a falha.
