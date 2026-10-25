import { PageHeading } from "@/components/content";
export const metadata = { title: "Termos de uso" };
export default function Terms() {
  return (
    <div className="container page-content">
      <PageHeading title="Termos de uso" />
      <article className="card prose">
        <h2>Finalidade educativa</h2>
        <p>
          A EDSON OFICINA disponibiliza conhecimento automotivo. Causas de
          falhas são possibilidades educativas, não diagnósticos definitivos.
          Consulte as especificações do fabricante e profissionais qualificados.
          Interrompa procedimentos que envolvam risco.
        </p>
        <h2>Conta e treinamentos</h2>
        <p>
          Mantenha suas credenciais em sigilo e informe dados corretos. Os
          treinamentos inicialmente oferecidos são gratuitos. A conclusão e o
          certificado dependem dos requisitos informados em cada curso. São
          cursos livres, sem promessa de habilitação profissional,
          reconhecimento oficial ou acadêmico.
        </p>
        <h2>Direitos autorais</h2>
        <p>
          Materiais próprios e de terceiros mantêm sua autoria. Vídeos externos
          são incorporados sem download. O portal não possui afiliação com
          Oficina Brasil Oficial. É proibido enviar material sem autorização ou
          usar a plataforma para distribuir conteúdo ilegal ou malicioso.
        </p>
        <h2>Disponibilidade e contato</h2>
        <p>
          Conteúdos externos podem ser removidos pelos titulares ou ficar
          indisponíveis. Falhas técnicas, solicitações de correção ou denúncias
          de autoria podem ser encaminhadas ao responsável pelo formulário de
          contato ou WhatsApp +55 85 98140-8606.
        </p>
      </article>
    </div>
  );
}
