# EDSON OFICINA

Portal automotivo em português brasileiro com Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL e Prisma. Marca e ilustração próprias. Responsável: Edson, Fortaleza/CE. WhatsApp: +55 85 98140-8606.

## Endereço público para navegação

Veja [o passo a passo de publicação no Render](docs/PUBLICAR.md). O arquivo `render.yaml` prepara web e PostgreSQL em planos Free para avaliação, sem comprar domínio. O endereço HTTPS é gerado pelo provedor depois que você cria/conecta sua conta e conclui o deploy. Confira os limites do plano gratuito antes de confirmar os recursos; não há contratação de plano pago automática nesta configuração.

## Desenvolvimento

Requisitos: Node.js 24, npm, Docker com Compose e FFmpeg/FFprobe no PATH. Use o checkout existente; tarefas na nuvem já são isoladas e não precisam de worktrees.

```bash
npm run setup
```

O script cria `.env` privado apenas se ainda não existir, gera segredos locais aleatórios, instala pelo lockfile, inicia PostgreSQL, aplica migrations e prepara categorias e conteúdos educativos originais. Não substitui `.env` existente.

Em terminais separados, no diretório do projeto:

```bash
npm run storage:dev
```

```bash
npx tsx scripts/storage-init.ts
npm run worker
```

```bash
npm run dev
```

O armazenamento local usa S3rver, diretório persistente `/workspace/.cache/edson-storage`, porta 9000 e credenciais públicas de desenvolvimento `S3RVER`. **É exclusivamente para desenvolvimento**, escuta loopback e não deve ser exposto na Internet. Para executar fora deste ambiente, ajuste `DEV_STORAGE_DIRECTORY` para um diretório gravável. Em produção use um bucket privado S3 ou MinIO com credenciais exclusivas. `.env.example` documenta as variáveis; `setup` preenche somente os valores locais.

Abra a aplicação pela porta 3000 no seu ambiente de desenvolvimento. Não basta iniciar o processo web: o worker executa publicações agendadas, importação do YouTube e processamento de vídeos.

## Primeiro administrador

Não há login nem senha padrão. Crie um arquivo privado **fora do repositório** com uma senha de pelo menos 12 caracteres (máximo de 72 bytes em UTF-8). Configure o caminho e o e-mail no comando abaixo, sem incluir a senha no comando:

```bash
ADMIN_EMAIL=seu-email@example.com ADMIN_NAME=Edson ADMIN_PASSWORD_FILE=/caminho/privado/senha npm run admin:create
```

Remova o arquivo após o uso. O comando é idempotente e redefine a senha/revoga sessões quando o e-mail já existe. Entre em `/login`, depois `/admin`. Administradores também podem cadastrar alunos e editores pelo painel.

## O que funciona

- Páginas públicas de início, vídeos, sistemas, peças, diagnóstico, guias, artigos, veículos, Academy, treinamentos, curso, contato e institucionais.
- 34 categorias, hierarquia e filtros por sistema, marca, modelo e ano. Nenhuma aplicação específica é inventada.
- Pesquisa no PostgreSQL com normalização de acentos, expansão de sintomas, autocomplete e índices GIN. Sugestões de diagnóstico são possibilidades educativas.
- Cadastro, login, cookies HTTP-only, sessões assinadas/revogáveis, perfis ADMIN/EDITOR/STUDENT, recuperação por e-mail com tokens de uso único e hash de senha bcrypt.
- CMS pelo navegador: conteúdos, tags, correções manuais de categoria, rascunho, publicação, agendamento UTC, ocultação, exclusão confirmada, autoria e referência.
- Cursos gratuitos com editor de módulos/aulas/questionários, matrícula, progresso no servidor, avaliação por aula, certificado PDF e validação por código que protege os dados pessoais do aluno.
- Vídeos próprios e PDFs em S3 privado, upload com progresso, limite de 200 MB, validação, fila persistente, conversão FFmpeg para HLS 360p/720p, miniatura e reprodução com hls.js. Arquivos de aula exigem matrícula.
- YouTube Data API v3: validação do handle e ID, páginas de 50 vídeos, deduplicação, atualização, classificação por metadados, quota local, fila, histórico, rechecagem de remoções e correções manuais preservadas.
- Contato armazenado no PostgreSQL, proteção por honeypot e limites persistentes; WhatsApp oficial.
- Tema claro/escuro, responsividade, links de salto, navegação por teclado, sitemap, robots, metadados sociais, manifesto e cabeçalhos de segurança.

Nenhum vídeo de terceiro é baixado. Não existe vínculo oficial com Oficina Brasil. Visualizações de vídeos usam estatísticas da API, não números inventados.

## Integrações externas

| Recurso                    | Configuração necessária                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Importação real do YouTube | `YOUTUBE_API_KEY`, API v3 habilitada no Google Cloud, acesso HTTPS a `www.googleapis.com`. ID e handle esperados já documentados no exemplo. |
| Recuperação de senha       | SMTP autorizado: host, porta, remetente e credenciais. Sem SMTP, a interface informa configuração pendente.                                  |
| Arquivos de produção       | Bucket S3 privado, região, endpoints interno e público, credenciais reais, CORS permitindo POST da origem exata da aplicação.                |
| HTTPS público              | VPS, domínio, DNS, portas 80/443 e `APP_URL` HTTPS.                                                                                          |

A importação ao vivo não foi validada sem uma chave real. Credenciais não devem ser enviadas no chat ou incluídas no Git. Chaves S3 são usadas localmente para assinatura HMAC; precisam ser injetadas como valores reais no processo pelo gerenciador seguro de segredos da VPS, não como marcadores de um proxy HTTP.

## Validação

Com PostgreSQL, armazenamento, web e worker ativos:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

`npm test` inclui um fluxo funcional com banco, HTTP e S3 reais: CMS, matrícula, questionário incorreto/correto, certificado PDF, controles de acesso, upload e conversão HLS. Usa dados temporários e os remove. Execute apenas em desenvolvimento/banco de teste. O teste recusa destino HTTP não local. Os testes do YouTube usam respostas controladas e não equivalem a validar a API ao vivo.

`test:e2e` usa Playwright com Chromium distribuído pelo pacote `@sparticuz/chromium` em ambiente Linux; `CHROMIUM_PATH` permite usar o navegador de sua instalação. Os projetos desktop e celular verificam navegação, cadastro, sessão, ausência de rolagem horizontal e acessibilidade da página inicial com axe. Capturas e traces ficam em `test-results/`, ignorado pelo Git.

`npm run build` gera o artefato de produção. Pare o servidor de desenvolvimento antes de construir; ambos usam `.next`. Para executar o build com npm, use `npm start`.

## Dados iniciais

`db:seed` é idempotente e não sobrescreve edições. Insere categorias e **7 textos educativos originais**, sem vídeos, alunos ou matrículas fictícios. Para experimentar o editor, `npx tsx scripts/demo.ts` cria um curso explicitamente marcado `[DEMONSTRAÇÃO]`, em rascunho. Não publique esse rascunho como treinamento completo sem revisão e autoria.

## Documentação

- [Implantação e operação na VPS](docs/DEPLOY.md)
- [Manual do administrador](docs/ADMIN.md)
- [Arquitetura, segurança e limitações](docs/ARCHITECTURE.md)
- [Resultados e critérios de aceitação](docs/VALIDATION.md)

O código está preparado para validação e implantação, mas a publicação em domínio real e a contratação/configuração de serviços dependem dos dados externos do responsável. As políticas legais precisam ser revisadas para refletir os provedores e os prazos reais da operação.
