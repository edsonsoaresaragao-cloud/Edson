import Link from "next/link";
import { CopExplorer } from "@/components/cop-explorer";
export const metadata = {
  title: "Ignição atual COP em 3D",
  description:
    "Explore bobinas individuais, enrolamentos, velas, sensores e ECU em um modelo interativo.",
};
export default function CurrentIgnition() {
  return (
    <div className="container page-content">
      <Link className="compressor-back" href="/categorias/ignicao">
        ← Voltar à Ignição
      </Link>
      <CopExplorer />
    </div>
  );
}
