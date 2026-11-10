# Manual básico de administração

## Acesso e permissões

Crie o primeiro administrador pelo comando `admin:create` documentado no README. Entre em `/login` e acesse `/admin`. Não há credenciais padrão. ADMIN gerencia todo o portal e as permissões. EDITOR pode administrar conteúdos, categorias, cursos e arquivos, sem ler alunos, mensagens, configurações e auditoria. STUDENT acessa apenas sua conta e seus treinamentos. Ao mudar perfil ou revogar sessões, os cookies antigos perdem validade.

## Conteúdos e categorias

1. Em **Todos os conteúdos**, selecione o tipo: vídeo, peça, diagnóstico, guia, artigo ou veículo.
2. Informe título, resumo, texto, autor, categorias e tags. URLs de imagem e referência devem usar HTTPS. Use somente materiais próprios ou licenciados. Para vídeos externos autorizados, informe o ID do YouTube.
3. Em peças, descreva função, funcionamento, localização comum, sintomas, manutenção e referências no campo técnico. Só preencha marca/modelo/ano quando houver aplicação confirmada.
4. Defina instrutor, dificuldade e visibilidade. Conteúdo privado fica fora do catálogo e só pode fornecer arquivos por vínculo com aula e matrícula. Para apostilas e vídeos restritos prefira associar o arquivo diretamente à aula.
5. Salve como rascunho ou publique. Para agendar, escolha **Agendado** e informe **data/hora UTC**; Fortaleza está três horas atrás de UTC. O worker precisa estar ativo. **Oculto** retira o conteúdo público. A exclusão exige digitar `EXCLUIR`.
6. Corrigir categorias no editor ativa a substituição manual; as sincronizações do YouTube preservam essa classificação. A confiança automática resulta de palavras em metadados e não é confirmação do conteúdo audiovisual.

O identificador de URL permanece estável ao editar. O texto é renderizado de forma segura, sem HTML arbitrário. Categorias podem ser organizadas em hierarquia; ciclos são rejeitados.

## YouTube

Configure `YOUTUBE_API_KEY` no servidor e reinicie os processos. Habilite a YouTube Data API v3 no Google Cloud, restrinja a chave à API necessária e acompanhe a quota no console do Google. O canal esperado é o handle `@OficinaBrasil-Oficial` e ID `UCkwom28UGBpkHFeTvOsLN8w`; divergências impedem importação.

Em **Importar YouTube**, escolha:

- **Atualizar vídeos recentes**: primeira página do acervo, até 50 vídeos.
- **Continuar importação do acervo**: próxima página salva, até 50 vídeos. Repita até percorrer o acervo.

A tarefa entra na fila e o worker executa. O agendamento automático atualiza recentes a cada `YOUTUBE_SYNC_INTERVAL_MINUTES` (mínimo 15). O limite local `YOUTUBE_DAILY_QUOTA` é um orçamento em dia UTC; a quota real do Google é independente. Cada chamada é contabilizada antes do envio. Falhas e tentativas continuam consumindo quota local. Consulte **Sincronizações e tarefas**. Tarefas tentam novamente com atraso, até três execuções; após isso, use **Tentar novamente** somente depois de corrigir a causa.

Vídeos privados, removidos ou não incorporáveis ficam fora do catálogo. A cada sincronização uma faixa antiga rotativa também é verificada. Quando o token de próxima página expirar, a API registrará falha; uma revisão de cursor pode ser necessária. A verificação ao vivo depende de credencial e rede reais.

## Arquivos próprios

Cadastre um conteúdo do tipo vídeo ou crie uma aula antes do envio. Em **Enviar vídeo / apostila**, associe o arquivo, escolha-o e acompanhe o progresso. Limite: 200 MB; vídeos MP4/WebM/MOV e PDFs. Arquivos de aula são restritos a matrículas, mesmo se também associados a um conteúdo público.

Após o envio, o servidor confere tamanho e tipo no S3. O worker valida o formato real e converte vídeos com FFmpeg para 360p e 720p, HLS e miniatura. O status deve mudar de PENDING para QUEUED, PROCESSING e READY. Se houver FAILED, consulte o erro e a tarefa associada. Arquivos originais não são servidos diretamente pelo portal. No registro do arquivo, abra “Excluir arquivo” e digite EXCLUIR para remover o original e as versões processadas. A exclusão de um cadastro de conteúdo preserva os arquivos para evitar perda acidental; remova-os separadamente quando necessário. PDFs são entregues como download, após verificação de assinatura e rejeição de recursos ativos conhecidos; isso não substitui antivírus e revisão de conteúdo em produção.

Para vídeo privado de curso, salve o vídeo com visibilidade privada, publique o cadastro e selecione-o no editor de aula; ou associe o upload diretamente à aula. Os acessos verificam a matrícula no servidor.

## Cursos e alunos

Em **Treinamentos, cursos e aulas**, informe apresentação, instrutor, objetivos, público, pré-requisitos, carga horária, nota mínima e status. Adicione módulos, aulas, conteúdo técnico e perguntas. Cada pergunta tem duas ou mais alternativas e uma resposta correta. O aluno não recebe o gabarito na página restrita.

O curso é gratuito. Aulas podem usar vídeo próprio ou YouTube autorizado; créditos e direitos devem ser conferidos antes da publicação. PDFs podem ser enviados depois que a aula estiver salva. A capa e os sistemas relacionados também podem ser cadastrados no editor. A busca encontra cursos por título e descrição.

Depois de haver matrícula, a estrutura, a carga horária e o critério de aprovação ficam protegidos para preservar o histórico. É possível atualizar a apresentação ou ocultar o curso sem destruir aulas. Para mudar a estrutura, crie uma nova edição. Cursos ocultos ficam indisponíveis aos alunos até republicação.

O aluno se cadastra ou pode ser criado em **Usuários**. Entregue a senha temporária em canal privado. A matrícula é solicitada na página pública do curso; o progresso fica no PostgreSQL. Cada aula precisa ser concluída; questionários exigem a nota mínima do curso. Tentativas insuficientes não gravam conclusão. Cursos sem questionário usam confirmação de leitura/conclusão pelo aluno, não comprovação de tempo assistido.

## Certificados, mensagens e operação

O aluno solicita o certificado após concluir todos os requisitos. O código é aleatório, único e verificável; a emissão é idempotente. O PDF contém nome, curso, carga horária, data, código e marca. A consulta pública revela o curso e a validade, mas não o nome do aluno; o PDF é restrito ao titular e ADMIN. Não há reconhecimento oficial presumido.

Mensagens do formulário aparecem em **Mensagens**; não são encaminhadas automaticamente a e-mail. Em **Configurações**, confira apenas a presença das variáveis, nunca valores secretos. A auditoria registra operações administrativas e seus responsáveis. Execute e valide backups conforme `DEPLOY.md`.
