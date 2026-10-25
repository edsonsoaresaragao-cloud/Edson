# Arquitetura e decisões

## Componentes

Next.js 16 / React 19 fornece páginas renderizadas no servidor e endpoints Node. TypeScript e Zod validam as entradas. Tailwind 4 e CSS próprio compõem o visual; Lucide e SVGs originais evitam imagens copiadas. PostgreSQL 17 mantém dados e fila. Prisma 7 com driver PostgreSQL JavaScript evita dependência de motores Rust no cliente. O lockfile fixa as versões efetivamente instaladas.

A fila usa bloqueio transacional PostgreSQL com `FOR UPDATE SKIP LOCKED`, tentativas limitadas e atraso progressivo. Um worker independente executa sincronização e conversão. Redis não é necessário para este volume inicial. Metadados dos vídeos ficam no banco; binários grandes ficam exclusivamente em S3. FFmpeg gera duas variantes HLS, miniatura e playlist mestre. O acesso às playlists e aos segmentos passa por autorização no backend.

Os modelos incluem usuários, perfis por papel, categorias hierárquicas, conteúdos tipados, tags e classificações, canais, cursos, módulos, aulas, questionários, matrículas, progresso, certificados, contatos, arquivos, sincronizações, tarefas, limites e auditoria. Tags e substituições de classificação usam campos indexados do conteúdo. Veículos e peças usam o CMS tipado, sem catálogo de aplicações inventado.

## Segurança implementada

- Hash bcrypt com custo 12 e limite explícito de 72 bytes; senha mínima de 12 caracteres.
- Sessão JWT HS256 com emissor, audiência, validade de 12 horas e versão no banco; cookie HTTP-only, SameSite Lax e Secure quando `APP_URL` é HTTPS.
- Estado modificado exclusivamente por POST com conferência da origem exata de `APP_URL`; nenhuma confiança em cabeçalhos de host encaminhados para essa autorização.
- Autorização no servidor, antes das operações; perfis e propriedade de matrícula/certificado/arquivo conferidos a cada acesso.
- Limites persistentes de login/cadastro/recuperação/contato; a limitação global complementa a por e-mail. Em produção acrescente limitação por IP no proxy confiável/CDN, sem confiar em X-Forwarded-For arbitrário.
- Recuperação de senha por token aleatório, hash no banco, expiração em 30 minutos, consumo transacional de uso único e revogação de sessões.
- Consultas parametrizadas, esquema de entrada, escape do React; conteúdos não aceitam HTML executável.
- S3 privado, formulários assinados por 10 minutos, limite de tamanho, tipos permitidos, verificação no servidor e validação no worker. Downloads restritos usam `private, no-store`.
- Execução FFmpeg sem shell, protocolos de entrada limitados a arquivo/pipe, duração de até duas horas, processo com timeout e limpeza de temporários.
- CSP, proteção de enquadramento, nosniff, política de referência e permissões do navegador. `unsafe-eval` é permitido apenas em desenvolvimento, necessário ao React/Next DevTools. Scripts inline são necessários à hidratação e à inicialização de tema; uma política com nonces pode substituir essa opção no endurecimento de produção.
- Docker de produção com usuário sem privilégios, capacidades removidas e limite de CPU/memória no worker; PostgreSQL não tem porta pública.

Não existe promessa de segurança absoluta ou certificação de conformidade LGPD. Antes de aceitar uploads não revisados, configure scanner antimalware, limites de recursos e revisão humana. PDFs podem conter construções maliciosas além das assinaturas conhecidas; nunca os renderize inline no domínio do portal. O limite original de 200 MB não garante um teto idêntico para o tamanho processado; monitore armazenamento e disco temporário.

## Busca e classificação

A busca usa função SQL normalizada com `unaccent`, parâmetros e índice trigram. Filtros estruturados são cumulativos. Consultas como “HB20 não liga” apresentam conteúdos gerais sobre bateria/partida/ignição como possibilidades; não presumem aplicação confirmada ao HB20. Marca/modelo/ano podem ser filtrados separadamente quando registrados. Autocomplete retorna apenas conteúdos publicados e públicos.

A classificação automática é determinística por títulos e descrições. É uma sugestão com confiança heurística, não resultado de um modelo que assistiu ao vídeo. Substituições manuais são preservadas. Não se inventam transcrições nem descrições de conteúdo não analisado.

## Limitações e dependências externas

A consulta às referências `oficinabrasil.com.br` e ao canal YouTube foi tentada antes da implementação e bloqueada pelo proxy (HTTP 403). A organização inicial segue o escopo fornecido: notícias, vídeos, sistemas e treinamentos. Nenhum código, texto, marca ou imagem foi extraído da referência. Não foi criado um fórum de terceiros; o fórum era referência de navegação, não um módulo solicitado na lista de páginas.

A importação real depende de chave, API habilitada, identidade verificada e quota. O teste controlado de integração não comprova conectividade ao serviço real. SMTP, bucket de produção, VPS, domínio, HTTPS e política legal definitiva são configurações externas, não dados presumidos.

O servidor S3rver local é ferramenta de desenvolvimento, não o servidor de produção. A configuração MinIO opcional não pôde ser executada neste ambiente por bloqueio da obtenção da imagem. O núcleo web/banco/upload foi testado com S3 compatível local. Caddy e os fluxos de backup/recuperação precisam ser validados na VPS real antes do lançamento.

Não há cobrança, promessa de reconhecimento acadêmico, compatibilidade automotiva não documentada, verificação de tempo assistido, proctoring de avaliações ou disparo automático de notícias copiadas. Cursos e notícias dependem de conteúdo autorizado cadastrado pelo responsável.
