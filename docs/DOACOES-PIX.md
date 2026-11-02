# Apoio ao projeto via Pix

Página `/apoiar`, com acesso **Apoiar com Pix ♡** no rodapé. Oferece QR Code estático de valor livre, chave de celular em E.164, código Pix Copia e Cola e identificação do beneficiário. Valor e confirmação são feitos no banco. O site não declara recebimento nem emite comprovante; não há integração bancária ou conciliação automática.

Destinatário público confirmado pelo usuário: **Edson Aragão**, **Fortaleza**, celular Pix **+55 85 98140-8606**. Definido em `src/lib/pix-beneficiary.ts`, já habilita a página sem configuração adicional no Render.

Para substituir o destinatário, as três variáveis abaixo podem ser configuradas juntas no servidor:

- `PIX_PHONE`: celular que já seja chave Pix, com DDD, em formato local de 11 dígitos ou internacional `+55`.
- `PIX_BENEFICIARY`: nome do titular que deve receber a doação.
- `PIX_CITY`: cidade do beneficiário.

Nome, cidade e celular foram confirmados na conversa antes da ativação. Sem variáveis de substituição (ou com as três vazias), usa-se o destinatário confirmado. Configuração parcial ou inválida de substituição desabilita a página de pagamento, sem misturar dados de contas.

BR Code gerado localmente com GUI `br.gov.bcb.pix`, conta telefônica, moeda BRL (`986`), país BR, nome/cidade normalizados e CRC16-CCITT-FALSE. Sem tag de valor, para o doador escolher no banco. Nome limitado a 25 caracteres e cidade a 15 no código; o nome completo permanece visível na página. Sem identificação de transação individual (`***` no campo de referência).

QR gerado no servidor com `qrcode`, margem de quatro módulos e correção M, servido como PNG embutido; não usa serviços de QR externos nem envia dados a terceiros. Clipboard via API do navegador; em caso de falha, seleciona o campo e oferece instrução para cópia manual. Não solicita dados bancários ou documentos do doador.

Validação: seis testes de telefone, vetor conhecido do CRC, estrutura TLV, ausência de valor fixo, validação de configuração, QR local, HTML e destinatário confirmado. TypeScript direcionado e lint aprovados. Sem confirmação bancária real, transferência de teste ou verificação visual em navegador nesta sessão. Build completo segue dependente da geração Prisma indisponível no ambiente.

Para publicar o código: Render → Manual Deploy → Deploy latest commit. O destinatário confirmado já está incluído no código. Não é preciso preencher variáveis para ativá-lo; dados sintéticos dos testes nunca são usados na página real.
