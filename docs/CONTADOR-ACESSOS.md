# Contador de acessos

O topo das páginas públicas, logo abaixo do menu principal, mostra o total de acessos ao site e à página atual. As cores acompanham os temas claro e escuro. A contagem começa na ativação desta versão; não recupera acessos anteriores e não representa pessoas únicas. Recarregar uma página ou navegar para outra registra uma nova visita. Mudar somente a pesquisa ou a âncora da URL não incrementa o contador.

## Funcionamento

`PageAccessCounter` envia o caminho público e um UUID aleatório por visita para `POST /api/page-access`. O PostgreSQL registra a visita e incrementa os dois totais na mesma transação. Um identificador repetido, inclusive após falha de resposta ou repetição de efeitos do React, não duplica o acesso. Reutilizar o identificador em outra página é recusado. `GET /api/page-access?path=/sobre` apenas consulta os números.

A migração `202611130002_page_access` cria `PageAccessCounter` e `PageAccessReceipt`. Os totais usam BIGINT e são transmitidos como strings para preservar precisão. São mantidos no banco existente e sobrevivem ao reinício do aplicativo. Os recibos temporários expiram após 24 horas; uma limpeza oportunista remove até 2.000 recibos vencidos a cada cinco minutos de atividade, sem apagar os totais.

Somente caminhos públicos conhecidos são aceitos. Conteúdos, categorias e cursos dinâmicos também têm a existência e a disponibilidade pública conferidas no banco. Áreas de conta, administração, recuperação de senha e códigos individuais de certificado são excluídas. Parâmetros de busca, fragmentos, conta, e-mail e cookies não são enviados pelo contador. A política de privacidade descreve esse tratamento.

Robôs conhecidos, prefetch e solicitações com DNT ou GPC não incrementam. A API exige a origem configurada, limita o corpo a 1 KB e aplica limite de 120 solicitações por minuto por endereço de rede. Esse limite mantém apenas um HMAC temporário em memória, com chave aleatória por processo e mapa limitado a 4.096 entradas; não grava IPs no banco. Não é uma ferramenta para auditoria ou medição de pessoas: bloqueio de JavaScript, falhas de rede e automações podem afetar a medição.

Se o banco estiver indisponível, a página continua funcionando e o contador oferece uma nova tentativa, preservando o identificador da visita. Não são exibidos totais inventados. A conexão usa `DATABASE_URL`, com até duas conexões adicionais por processo; não exige um serviço externo nem chave nova.

## Publicação

O fluxo existente `scripts/start-render.sh` executa `prisma migrate deploy` antes de iniciar o serviço. Após enviar o commit para `main`, usar **Render → Manual Deploy → Deploy latest commit**. Não executar reset ou recriar o banco. Confirmar a aplicação de `202611130002_page_access` nos logs, abrir uma página pública e conferir o contador abaixo do menu. O startup já resolve `APP_URL` a partir de `RENDER_EXTERNAL_URL` quando necessário.

A API do contador também resolve essa origem diretamente: usa `APP_URL` quando configurada, depois `RENDER_EXTERNAL_URL`, e por último o endereço local de desenvolvimento. Assim, o endereço automático do Render é reconhecido mesmo quando o processo não recebe `APP_URL` do script de inicialização. Uma origem externa continua sendo recusada e `APP_URL` mantém prioridade quando ambas estão definidas.

## Verificação

Foram verificados 13 testes de validação e PostgreSQL real, incluindo a origem do Render sem `APP_URL`, a prioridade do endereço configurado, 20 repetições simultâneas de um evento, 40 visitas simultâneas distintas, persistência em novas conexões, remoção de recibos vencidos e disponibilidade pública dos conteúdos. Os números também foram comparados antes e depois de reiniciar o servidor Next.js e permaneceram iguais. Os testes de integração só aceitam banco local chamado `page_counter` e limpam exclusivamente as tabelas do contador nesse banco isolado.

```bash
COUNTER_TEST_DATABASE_URL=postgresql://usuario:senha@127.0.0.1:55432/page_counter npx tsx --test tests/page-access.test.ts tests/page-access-postgres.test.ts
```

Com as migrações aplicadas nesse banco e o servidor de desenvolvimento usando a mesma URL, seis testes Playwright verificam desktop e celular: incrementos reais, recarga, navegação, ausência de cookies e dados da URL, exclusão de páginas privadas, origem externa recusada, resposta perdida sem duplicação, acessibilidade do contador e ausência de rolagem horizontal.

```bash
COUNTER_TEST_DATABASE_URL=postgresql://usuario:senha@127.0.0.1:55432/page_counter npx playwright test tests/browser/page-access.spec.ts
```

ESLint e a verificação TypeScript dos módulos, componente e testes do contador passaram. Na validação local inicial da suíte geral, 278 testes passaram, dois foram ignorados e dois arquivos existentes (`flows.test.ts` e `youtube.test.ts`) falharam ao importar o cliente Prisma ainda não gerado.

O build e a migração do commit inicial do contador (`de48b0d`) passaram no [GitHub Actions](https://github.com/edsonsoaresaragao-cloud/Edson/actions/runs/43431674482). Essa execução falhou depois, em seis testes de outras telas; os testes de navegador do contador ainda não estavam habilitados nela.

O workflow `.github/workflows/page-access.yml` agora verifica o contador separadamente em cada push e pull request: gera o cliente Prisma, aplica as migrações, executa os testes com PostgreSQL, compila o aplicativo e testa o servidor de produção no desktop e celular. Usa somente um banco temporário da execução, `RENDER_EXTERNAL_URL=http://localhost:3100` e nenhuma `APP_URL`, reproduzindo o caso corrigido.

O ambiente local desta conversa ainda retornou HTTP 403 para o download do Prisma após a alteração de configuração informada pelo usuário. Os testes locais do contador usam a implementação real com `pg`, sem substituir o Prisma nem simular o banco; o workflow valida também a geração e o build completos.
