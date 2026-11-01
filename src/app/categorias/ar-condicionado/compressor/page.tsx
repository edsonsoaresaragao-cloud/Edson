import Link from "next/link";
import { CompressorExplorer } from "@/components/compressor-explorer";
export const metadata = {
  title: "Compressor de ar-condicionado em 3D | Edson Oficina",
  description:
    "Explore polia, embreagem, carcaças e pistões de um compressor axial em corte e vista explodida.",
};
export default function CompressorPage() {
  return (
    <div className="container page-content">
      <Link className="compressor-back" href="/categorias/ar-condicionado">
        ← Voltar ao ar-condicionado
      </Link>
      <CompressorExplorer />
    </div>
  );
}
