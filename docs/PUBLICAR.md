# Criar um endereço público no Render

O repositório contém `render.yaml` para criar um serviço web Docker e PostgreSQL no Render. O provedor gera o endereço HTTPS ao concluir a implantação; este documento não presume um hostname já reservado nem uma publicação concluída.

## Etapa necessária do responsável

1. Crie sua própria conta no [Render](https://render.com/) e conecte sua conta GitHub. Não envie senhas ou tokens no chat.
2. Abra a [publicação deste repositório](https://render.com/deploy?repo=https://github.com/edsonsoaresaragao-cloud/Edson).
3. Autorize o acesso somente ao repositório `edsonsoaresaragao-cloud/Edson`, se solicitado.
4. Revise os dois recursos definidos em `render.yaml`, mantendo **Free**. Se o painel não oferecer Free, não confirme planos pagos automaticamente; revise a alternativa antes de criar os recursos.
5. Aguarde o banco e o serviço web concluírem a inicialização. O painel do serviço mostrará a URL HTTPS efetivamente criada. Use essa URL para navegar.

A existência do botão de implantação e do arquivo de configuração não significa que o site já esteja publicado. A criação da conta, a concessão de acesso e a criação dos recursos acontecem no provedor.

## Configuração automática

O serviço recebe a conexão PostgreSQL de seu recurso de banco e um `SESSION_SECRET` gerado pelo provedor. Nenhuma senha fixa é incluída no YAML. O comando de inicialização usa `RENDER_EXTERNAL_URL` como `APP_URL`, habilitando cookies Secure e a verificação da origem exata para cadastro, login e formulários.

As migrations são aplicadas antes de iniciar o servidor. O seed roda somente em banco sem categorias e sem conteúdos, preservando edições e exclusões nas inicializações seguintes. O endpoint `/api/health` precisa responder com sucesso para o deploy ficar saudável. Domínio próprio é opcional; após configurá-lo, defina `APP_URL` para a origem definitiva e refaça o build para atualizar metadados estáticos.

## Escopo da avaliação gratuita

A configuração cria somente web e PostgreSQL. Navegação, CMS, contas, cursos, matrículas, progresso, contatos e certificados utilizam o banco real. Não publica o emulador S3rver nem abre as portas do banco à Internet.

YouTube ao vivo precisa de chave válida e worker; uploads e transcodificação precisam de S3 de produção e worker; recuperação de senha precisa de SMTP. Nenhuma dessas integrações é anunciada como funcionando só porque o web ficou acessível. O comando de inicialização executa web e worker no mesmo serviço gratuito, com encerramento conjunto se um deles falhar. Não cria um serviço pago adicional. No plano gratuito, ambos pausam quando o serviço web é suspenso por inatividade; tarefas voltam a ser processadas quando ele desperta. Para execução contínua, use infraestrutura apropriada.

Confira os limites atuais em [serviços gratuitos do Render](https://render.com/docs/free), inclusive suspensão por inatividade e prazo do PostgreSQL gratuito. A configuração gratuita é para avaliação, não uma promessa de hospedagem permanente ou de banco sem prazo. Antes de usar dados importantes, configure retenção, backup externo e uma infraestrutura durável.

## Primeiro acesso administrativo

Não existe conta administrativa padrão. Siga a criação de administrador no README em um ambiente com acesso seguro ao banco. Se o plano escolhido não disponibilizar terminal de serviço, a criação deve ser feita por um comando de inicialização único ou por uma máquina autorizada, sem expor senha em argumentos públicos. Não transforme o primeiro usuário cadastrado em ADMIN automaticamente.

## Limitação deste ambiente de configuração

O ambiente de nuvem não disponibiliza uma porta pública. Foram observados bloqueios de proxy HTTP 403 ao consultar Render e os serviços de túnel temporário. Criar/salvar o ambiente no ChatGPT não publica o site. A conta Render do responsável é o requisito externo para a implantação pelo painel.

## Referências da configuração

A estrutura do Blueprint foi conferida com [a referência oficial do Render](https://github.com/render-oss/skills/blob/main/skills/render-blueprints/references/field-reference.md) e [o exemplo oficial de web + PostgreSQL Free](https://github.com/render-oss/skills/blob/main/skills/render-deploy/assets/python-django.yaml). A validação final no provedor exige a conta/workspace do responsável e acontece no painel antes de criar recursos; não é alegada como concluída nesta preparação local.

## Verificação local da preparação

A imagem de produção foi construída e inicializada com o mesmo comando do Blueprint, simulando a variável de endereço externo do provedor. Foram conferidos migrations, preservação dos dados existentes, homepage, CSS, SVG, busca, cadastro, página do aluno, cookie Secure/HttpOnly e rejeição de origem indevida. O processo executou como usuário `node`, com filesystem somente leitura e sem privilégios adicionais. A conta temporária de validação foi removida.

Isso valida o pacote e sua inicialização; não cria recursos no Render nem reserva um endereço público. O domínio efetivo será exibido pelo provedor após o responsável concluir a implantação.

## Ativar os vídeos do YouTube

1. No Google Cloud, habilite **YouTube Data API v3** e crie uma chave de API restrita a essa API.
2. No Render, abra o serviço **edson-oficina → Environment** e configure `YOUTUBE_API_KEY` com essa chave. Não publique a chave no código ou no chat.
3. Salve e implante a versão atualizada do repositório. Os logs devem mostrar “Worker iniciado”.
4. Entre como administrador em `/admin/youtube` e use **Atualizar vídeos recentes**. A importação inicial também é enfileirada automaticamente pelo worker quando há uma chave configurada.
5. Use **Continuar importação do acervo** para carregar páginas anteriores (até 50 vídeos por tarefa). Confira a última sincronização no painel.

Sem a chave, nenhum vídeo externo é importado. Uma chave inválida, quota esgotada ou restrições incompatíveis aparecem no histórico de sincronização. Vídeos privados, removidos ou sem permissão de incorporação não são reproduzidos dentro do site.
