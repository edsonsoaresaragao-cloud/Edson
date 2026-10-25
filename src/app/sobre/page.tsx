import { PageHeading } from "@/components/content";
import Link from "next/link";
export const metadata = { title: "Quem somos" };
export default function About() {
  return (
    <div className="container page-content">
      <PageHeading
        title="Conhecimento que movimenta a mecânica."
        description="EDSON OFICINA é um portal brasileiro de conhecimento automotivo, sob responsabilidade de Edson, em Fortaleza, Ceará."
      />
      <article className="card prose">
        <h2>Aprender para evoluir</h2>
        <p>
          Organizamos conteúdos educativos sobre peças, sistemas, manutenção,
          diagnóstico e gestão de oficinas e frotas. A Academy reúne
          treinamentos gratuitos com acompanhamento individual.
        </p>
        <h2>Respeito à autoria</h2>
        <p>
          Os vídeos externos são apresentados pelo player oficial, com indicação
          do canal de origem. EDSON OFICINA não é afiliada, parceira oficial ou
          proprietária do conteúdo do canal Oficina Brasil Oficial.
        </p>
        <h2>Informação com responsabilidade</h2>
        <p>
          Os materiais são educativos. Não substituem a documentação técnica do
          fabricante, a inspeção do veículo ou a atuação de profissional
          qualificado.
        </p>
        <Link href="/contato" className="button">
          Entre em contato ↗
        </Link>
      </article>
    </div>
  );
}
