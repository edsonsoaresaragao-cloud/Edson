import Link from "next/link";
import { AlternatorDiagnosis } from "@/components/alternator-diagnosis/workbench";
export const metadata = {
  title: "Diagnóstico avançado do alternador | EDSON OFICINA",
  description:
    "Diagnóstico por evidências, testes elétricos, ripple, carga inteligente e relatório do sistema de carga.",
};
export default async function AlternatorDiagnosticPage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string }>;
}) {
  const { component } = await searchParams;
  const selected = Number(component);
  return (
    <div className="container page-content">
      <AlternatorDiagnosis
        showComponent={
          Number.isInteger(selected) && selected >= 1 && selected <= 16
        }
        initialComponent={
          Number.isInteger(selected) && selected >= 1 && selected <= 16
            ? selected
            : 5
        }
      />
      <section className="section">
        <h2>Vídeos técnicos relacionados</h2>
        <p>
          Consulte os conteúdos de alternadores, ensaios e sistemas inteligentes
          já disponíveis no portal.
        </p>
        <Link className="button" href="/videos?category=alternador">
          Vídeos de alternador ↗
        </Link>
        <Link className="button" href="/busca?q=alternador">
          Pesquisar conteúdos e treinamentos ↗
        </Link>
      </section>
    </div>
  );
}
