import { PageHeading } from "@/components/content";
export const metadata = { title: "Política de privacidade" };
export default function Privacy() {
  return (
    <div className="container page-content">
      <PageHeading title="Política de privacidade" />
      <article className="card prose">
        <h2>Responsável e contato</h2>
        <p>
          Edson, responsável pela EDSON OFICINA, Fortaleza, Ceará, Brasil.
          Solicitações sobre dados pessoais: formulário de contato ou WhatsApp
          +55 85 98140-8606.
        </p>
        <h2>Dados e finalidades</h2>
        <p>
          Tratamos nome, e-mail e hash da senha para manter sua conta;
          matrículas, respostas avaliadas e progresso para fornecer os
          treinamentos; registros de emissão para validar certificados; e
          mensagens de contato para responder às solicitações. Não armazenamos a
          senha em texto aberto. A execução do serviço solicitado fundamenta o
          tratamento necessário à conta e aos cursos. Registros mínimos de
          segurança apoiam a proteção do portal.
        </p>
        <h2>Cookies e terceiros</h2>
        <p>
          O cookie de sessão é necessário à autenticação e tem duração de até 12
          horas. A preferência visual fica no armazenamento local do navegador.
          Não incluímos rastreadores publicitários próprios. Ao abrir páginas
          com vídeos incorporados, o player YouTube pode transmitir dados ao
          Google segundo suas próprias políticas. Arquivos são armazenados no
          provedor S3 configurado pelo responsável. O envio de e-mails depende
          do provedor SMTP contratado.
        </p>
        <h2>Retenção, segurança e direitos</h2>
        <p>
          Os dados são mantidos enquanto necessários à prestação do serviço,
          segurança e comprovação do histórico solicitado. Prazos específicos e
          eventuais obrigações legais devem ser definidos pelo responsável antes
          do lançamento público. Você pode solicitar acesso, correção,
          portabilidade quando aplicável, informações sobre compartilhamento ou
          exclusão pelo contato. A exclusão de registros poderá afetar o acesso
          aos cursos e a validação dos certificados.
        </p>
        <h2>Antes da publicação</h2>
        <p>
          Esta política descreve a implementação atual. O responsável deve
          confirmar provedores, transferências internacionais, prazos de
          retenção, base legal e canal de atendimento conforme sua operação
          antes de abrir o portal ao público.
        </p>
      </article>
    </div>
  );
}
