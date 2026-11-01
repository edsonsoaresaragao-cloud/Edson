import Link from "next/link";
import { EpsExplorer } from "@/components/eps-explorer";
export const metadata = {
  title: "Direção elétrica EPS em 3D | Edson Oficina",
  description:
    "Explore sensor de torque, ECU, motor e cremalheira de um sistema EPS em vista montada, corte e explosão.",
};
export default function EpsPage() {
  return (
    <div className="container page-content">
      <Link
        className="compressor-back"
        href="/categorias/direcao-hidraulica-e-eletrica"
      >
        ← Voltar à direção hidráulica e elétrica
      </Link>
      <EpsExplorer />
    </div>
  );
}
