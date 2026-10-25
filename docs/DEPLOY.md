# Implantação em VPS Ubuntu

## Pré-requisitos externos

Providencie VPS Ubuntu suportado, acesso administrativo, Docker Engine com Compose, domínio com DNS apontando para a VPS e portas 80/443 liberadas. Recomendação inicial: 2 vCPU e 4 GB de RAM, ajustando após medir transcodificação e tráfego. Não foi presumida nem contratada infraestrutura. Em produção, **não use o S3rver de desenvolvimento**.

Escolha um bucket privado S3 compatível ou o MinIO opcional. Configure SMTP para recuperação de senha e uma chave Google Cloud com YouTube Data API v3 habilitada. Não é necessário configurar cobrança no portal.

## Configuração

1. Copie o projeto para a VPS preservando o lockfile.
2. Copie `.env.example` para `.env`, proteja com `chmod 600 .env` e preencha os valores reais por canal seguro.
3. Defina `DOMAIN`, `APP_URL=https://seu-dominio` e `SESSION_SECRET` aleatório de pelo menos 32 caracteres. Use uma senha PostgreSQL aleatória **hexadecimal**, evitando caracteres reservados em URL. O Compose conecta o banco pelo hostname `db`.
4. Configure o bucket e o endpoint S3 acessível internamente, o endpoint público HTTPS usado pelo navegador, região e credenciais exclusivas. Nunca use as credenciais `S3RVER` em produção. Não habilite acesso público ao bucket.
5. Configure `YOUTUBE_API_KEY` e SMTP. Nenhuma chave ou senha deve ser incluída no Git, em argumentos compartilhados ou no chat. Chaves S3/SMTP devem ser valores reais injetados no processo, pois assinatura HMAC e SMTP não funcionam com marcadores de proxy HTTPS.

`APP_URL` também é argumento de build não secreto: se o domínio mudar, reconstrua a imagem para atualizar os metadados das páginas estáticas. Não exponha a porta do PostgreSQL nem o console de armazenamento publicamente.

## Subir o portal

```bash
docker compose -f compose.prod.yaml config --quiet
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
```

O serviço `migrate` aplica migrations antes de `web` e `worker`. O Caddy aguarda a saúde do web e solicita automaticamente certificado HTTPS para o domínio configurado. Valide DNS e conectividade com a autoridade certificadora. A configuração foi preparada; emissão real de TLS não foi executada no ambiente de desenvolvimento.

Prepare categorias/textos autorais e o bucket:

```bash
docker compose -f compose.prod.yaml run --rm migrate npm run db:seed
docker compose -f compose.prod.yaml run --rm migrate npx tsx scripts/storage-init.ts
```

A inicialização S3 cria o bucket se ausente e ajusta CORS para POST da origem exata. Em um bucket gerenciado já existente, use permissão de configuração somente na inicialização; depois restrinja a credencial de execução a listar os prefixos necessários, conferir, ler e gravar os objetos daquele bucket. Não compartilhe chaves de conta raiz com a aplicação.

Crie o administrador com um arquivo de senha privado na VPS e volume somente leitura:

```bash
docker compose -f compose.prod.yaml run --rm \
  -e ADMIN_EMAIL=seu-email@example.com -e ADMIN_NAME=Edson \
  -e ADMIN_PASSWORD_FILE=/run/admin-password \
  -v /caminho/privado/senha:/run/admin-password:ro \
  migrate npm run admin:create
```

Apague o arquivo após o uso. O processo da imagem roda como usuário `node`; permita que esse usuário leia somente o arquivo montado, sem abrir permissões globais. Não há senha padrão.

## MinIO próprio opcional

`compose.storage.yaml` adiciona MinIO com dados em volume e um segundo domínio no Caddy. Configure também `STORAGE_DOMAIN`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `S3_ENDPOINT=http://storage:9000` e `S3_PUBLIC_ENDPOINT=https://seu-dominio-de-arquivos`. O DNS dos dois domínios deve apontar para a mesma VPS.

```bash
docker compose -f compose.prod.yaml -f compose.storage.yaml config --quiet
docker compose -f compose.prod.yaml -f compose.storage.yaml up -d --build
docker compose -f compose.prod.yaml -f compose.storage.yaml run --rm migrate npx tsx scripts/storage-init.ts
```

A imagem MinIO fixada **não pôde ser obtida no ambiente de onboarding** (negação da rota do registro). Valide disponibilidade e integridade no destino, ou use seu provedor S3 existente; não desative verificação TLS ou de assinatura. Substituir a imagem por uma distribuição suportada requer revisão operacional. O console fica ligado apenas a loopback na porta 9001; acesso administrativo por túnel SSH. Crie um usuário de serviço com escopo do bucket, substitua as chaves S3 da aplicação e reinicie web/worker.

## Verificações antes de abrir ao público

- Verifique a resposta HTTPS de `/api/health` e os logs de `web`, `worker`, `migrate` e `proxy`.
- Entre como administrador, crie um conteúdo e confirme a publicação/ocultação pelo navegador.
- Faça uma importação real e confira identidade, crédito, incorporação e histórico do YouTube.
- Cadastre um curso autoral; teste matrícula, aula, reprovação/aprovação e PDF de certificado.
- Envie um vídeo e uma apostila para o **bucket de produção**; confirme reprodução e negação de acesso sem matrícula.
- Teste o e-mail de recuperação, expiração e uso único do link com uma conta sob seu controle.
- Revise autoria, política de privacidade, provedores, transferência de dados, retenção, atendimento LGPD e termos.
- Configure antivírus/revisão de arquivos, atualizações de segurança e monitoramento conforme o risco e o volume da operação. O validador atual rejeita formatos incorretos e PDFs com recursos ativos conhecidos, mas não equivale a um scanner antimalware completo.

A verificação em desenvolvimento não comprova disponibilidade de YouTube, SMTP, S3, TLS ou backups em produção.

## Logs, monitoramento e recuperação

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs --tail=100 web worker migrate proxy
```

Docker limita os arquivos de log a 3 × 10 MB por serviço. Caddy registra status e metadados das requisições em JSON, removendo URI e cabeçalhos de autenticação para não registrar tokens de recuperação. Não acrescente logs com valores de cookies, senhas, chaves ou URLs de recuperação. Restrinja acesso aos logs, pois caminhos de requisições podem conter dados pessoais ou códigos. Configure um monitor externo para o endpoint de saúde e alertas para indisponibilidade, disco, consumo S3, falhas de tarefa e idade da última sincronização válida. O endpoint de saúde verifica o banco; não comprova que o worker está ativo. Confira a fila no painel e a atividade do serviço `worker`.

Reinício após falha:

```bash
docker compose -f compose.prod.yaml restart web worker
```

Tarefas em execução com bloqueio abandonado são recuperadas após duas horas. Processamento e gravação dos objetos são idempotentes; tarefas têm três tentativas com atraso. Após corrigir uma falha definitiva, o administrador pode reenfileirar pelo painel. Para mudanças de aplicação, faça backup, reconstrua e recrie os serviços; migrations são aplicadas antes de liberar o web. Não faça rollback de esquema sem avaliar compatibilidade.

## Backup e restauração

```bash
BACKUP_DIR=/caminho/protegido/backups bash scripts/backup.sh
```

O script usa `pg_dump`, compressão, teste gzip e SHA-256; não imprime credenciais. Agende diariamente por cron ou timer sob usuário autorizado, com destino criptografado e cópia externa à VPS. Defina retenção conforme a operação. Para o Compose opcional, informe `EDSON_COMPOSE_FILE=compose.prod.yaml` e use o serviço db do mesmo projeto. Objetos S3 requerem **backup independente**: habilite versionamento no provedor e/ou cópia por ferramenta de backup suportada para outro bucket/conta, incluindo `originals/` e `processed/`. Volume Docker não é backup.

Teste restauração primeiro em uma instância vazia isolada, com a mesma versão PostgreSQL e a configuração correta. O dump contém as tabelas e migrations; não aplique migrations antes de restaurar um dump completo em banco vazio.

```bash
CONFIRM_RESTORE=edson bash scripts/restore.sh /caminho/protegido/edson-DATA.sql.gz
```

O script verifica checksum, gzip e erro SQL, e exige confirmação explícita. Valide usuários, conteúdos, matrículas e referências aos objetos restaurados. O backup e a restauração do PostgreSQL foram testados localmente em banco isolado, preservando o principal. A execução na VPS, a política de retenção e a recuperação de objetos dependem de acesso real ao destino; não foram apresentadas como concluídas.

## Redes com autoridade certificadora própria

No ambiente de nuvem usado no desenvolvimento, o proxy HTTPS exige a CA fornecida pelo próprio ambiente. O build Docker foi validado mantendo TLS ativo e injetando essa CA **somente na etapa de instalação**, por segredo de build (não é copiada ao repositório nem à imagem):

```bash
BUILDX_CONFIG=/workspace/.cache/buildx docker build \
  --secret id=build_ca,src=/caminho/da/ca-confiavel.crt \
  --build-arg APP_URL=https://seu-dominio \
  -t edson-oficina:local .
```

Sem proxy com CA própria, o build normal não precisa desse parâmetro. Se o proxy também interceptar as chamadas do contêiner em execução, monte a CA oficial somente leitura e configure `NODE_EXTRA_CA_CERTS` para esse caminho. Nunca desative `strict-ssl`, TLS ou a verificação de checksums para contornar falhas de rede.
