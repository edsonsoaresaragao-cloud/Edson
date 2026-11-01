# Apoio ao projeto via Pix

Página `/apoiar`, com acesso **Apoiar com Pix ♡** no rodapé. Oferece QR Code estático de valor livre, chave de celular em E.164, código Pix Copia e Cola e identificação do beneficiário. Valor e confirmação são feitos no banco. O site não declara recebimento nem emite comprovante; não há integração bancária ou conciliação automática.

Dados públicos exigidos no servidor:

- `PIX_PHONE`: celular que já seja chave Pix, com DDD, em formato local de 11 dígitos ou internacional `+55`.
- `PIX_BENEFICIARY`: nome do titular que deve receber a doação.
- `PIX_CITY`: cidade do beneficiário.

Nenhum número é presumido como chave de recebimento apenas porque consta no contato do site. Sem os três dados válidos, `/apoiar` exibe uma mensagem de disponibilidade futura, sem chave nem QR Code. No momento da implementação, o usuário informou somente `85` (DDD). A confirmação do celular completo, titular e cidade permanece pendente; não há destinatário ativo configurado no código.

BR Code gerado localmente com GUI `br.gov.bcb.pix`, conta telefônica, moeda BRL (`986`), país BR, nome/cidade normalizados e CRC16-CCITT-FALSE. Sem tag de valor, para o doador escolher no banco. Nome limitado a 25 caracteres e cidade a 15 no código; o nome completo permanece visível na página. Sem identificação de transação individual (`***` no campo de referência).

QR gerado no servidor com `qrcode`, margem de quatro módulos e correção M, servido como PNG embutido; não usa serviços de QR externos nem envia dados a terceiros. Clipboard via API do navegador; em caso de falha, seleciona o campo e oferece instrução para cópia manual. Não solicita dados bancários ou documentos do doador.

Validação: cinco testes de telefone, vetor conhecido do CRC, estrutura TLV, ausência de valor fixo, validação de configuração, QR local e HTML. TypeScript direcionado e lint aprovados. Sem confirmação bancária real, transferência de teste ou verificação visual em navegador nesta sessão. Build completo segue dependente da geração Prisma indisponível no ambiente.

Para publicar o código: Render → Manual Deploy → Deploy latest commit. Para habilitar recebimento, os três dados precisam ser confirmados e configurados no ambiente do Render; dados de teste dos testes automatizados nunca são usados na página real.
