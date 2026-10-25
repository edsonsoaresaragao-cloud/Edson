# Validação da entrega

Execução local em 25/10/2026, Node.js 24.19, Next.js 16.4.3, Prisma 7.10.1 e PostgreSQL 17. Os resultados abaixo descrevem esta execução, sem presumir serviços externos ou restauração em outra tarefa.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm run setup` com `npm ci` | Passou; instalação pelo lockfile, banco saudável, quatro migrations aplicadas e repetição sem migrations pendentes. |
| `npm run lint` | Passou, sem erros ou avisos. |
| `npm run typecheck` | Passou. |
| `npm run build` | Passou; saída standalone com estáticos e sem arquivos `.env` no artefato. |
| `npm test` | 5 testes passaram, nenhum ignorado. Inclui integração HTTP/PostgreSQL/S3 real. |
| `npm run test:e2e` | 6 testes passaram, nenhum ignorado: desktop e celular, navegação, cadastro, sessão e edição administrativa. |
| Acessibilidade inicial | Axe sem violações nas regras WCAG 2 A/AA e 2.1 AA verificadas, nos temas claro e escuro, em desktop e celular. Não equivale a auditoria manual integral de todas as páginas. |
| Dependências de produção | `npm audit --omit=dev`: zero vulnerabilidades conhecidas reportadas na consulta. |
| Docker | Imagem `edson-oficina:test` construída. A CA do proxy foi injetada temporariamente no build, mantendo TLS. |
| Contêiner em execução | Homepage, banco, busca, CSS e SVG responderam HTTP 200 em contêiner sem privilégios e com filesystem somente leitura. |
| Backup e restauração | Dump comprimido com checksum restaurado em PostgreSQL isolado: 34 categorias e 7 conteúdos conferidos. O banco principal foi preservado. |
| Compose e Caddy | Arquivos Compose padrão/produção/armazenamento passaram na validação de configuração; ambos os Caddyfiles foram interpretados pela imagem oficial Caddy. |

O teste funcional cobre rejeição de origem indevida, sessão HTTP-only, autorização administrativa, CMS persistente, matrícula, proteção de aula sem matrícula, nota insuficiente, conclusão aprovada, preservação da estrutura de curso com matrículas, emissão idempotente, PDF real, proteção do nome do aluno na consulta pública, negação de PDF para outra conta, upload assinado, conferência do objeto, fila, transcodificação HLS, bloqueio de reprodução por aluno não matriculado e exclusão confirmada do arquivo. Também verifica redefinição por token de uso único e revogação de sessões. Os dados temporários são removidos ao fim.

A integração YouTube é exercitada com respostas controladas: rejeita identidade divergente, importa metadados, deduplica, mantém categoria/visibilidade manual e marca vídeos removidos como indisponíveis. Isso **não comprova importação ao vivo**.

Os testes de navegador criam artigo e treinamento pelo painel, sem editar código ou enviar JSON manualmente. Os arquivos de captura ficam em `test-results/`, ignorados pelo Git. O banco principal permanece com 34 categorias, 7 conteúdos educativos originais e nenhuma conta, matrícula ou curso fictício depois da limpeza.

## Critérios de aceitação e dependências

| Critério do pedido | Evidência / condição |
| --- | --- |
| Site, páginas e navegação | Rotas públicas implementadas; navegação funcional exercitada no navegador. |
| Categorias, filtros e busca | 34 categorias no banco, filtros no servidor, busca com acentos e autocomplete; consulta funcional validada. |
| Backend, banco e painel | Operações persistentes reais, permissões e CMS testados por HTTP e navegador. |
| Conteúdos e cursos pelo administrador | Artigo e treinamento com módulo/aula/questionário criados no navegador. |
| Uploads próprios | Upload S3 local compatível e processamento HLS validados; bucket de produção depende de configuração e teste no destino. |
| YouTube e classificação | Implementados e testados com respostas controladas; chave válida e acesso real continuam necessários. |
| Alunos, matrículas e progresso | Cadastro e sessão pelo navegador; matrícula e progresso persistente pela integração real. |
| Certificados | PDF válido, regras de conclusão, código único e privacidade conferidos. |
| WhatsApp | Link com `5585981408606` conferido pelo navegador. |
| Computador e celular | Testes Playwright em dois tamanhos, incluindo ausência de overflow horizontal e temas claro/escuro. |
| Build e implantação VPS | Build local e imagem Docker passaram. Documentação de VPS, HTTPS, logs e rotinas de backup entregue. VPS e TLS públicos dependem dos dados externos. |

## Itens externos pendentes

A API real do YouTube precisa de chave válida, API habilitada e quota. SMTP externo precisa de provedor/remetente/credenciais e teste de entrega. Bucket de produção, DNS, VPS, certificados HTTPS reais e provedor de backup externo não foram fornecidos. A imagem MinIO opcional não pôde ser obtida pela rota de registro deste ambiente; o armazenamento local validado usa S3rver somente em desenvolvimento.

O acesso às referências Oficina Brasil e YouTube foi bloqueado por HTTP 403; nenhuma análise visual completa da referência é alegada. O portal tem identidade e ilustrações próprias, sem conteúdo copiado ou afiliação presumida.

Antes do lançamento, o responsável deve revisar textos técnicos, direitos de materiais, identidade dos instrutores, carga horária real dos cursos, política de privacidade, provedores, retenção e proteção antimalware de arquivos. Não existe conta administrativa padrão; crie a primeira com `admin:create` e um arquivo de senha privado.

## Ambiente de nuvem

Foram salvos `install_script`, `start_skill`, os domínios adicionais necessários e o requisito seguro `YOUTUBE_API_KEY` no rascunho do ambiente. Isso não publica o site nem aplica os serviços externos. Revise e salve o rascunho nas configurações e publique o ambiente pelo produto quando desejar preservar a preparação. A restauração em uma tarefa nova não foi testada.
