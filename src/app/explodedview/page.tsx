import Link from "next/link";
import { EngineCatalog } from "@/components/engine-catalog";
export const metadata = {
  title: "Motores em vista explodida",
  description:
    "Catálogo educativo de famílias de motores nacionais e importados, com vistas explodidas ilustrativas e componentes interativos.",
};
export default function ExplodedViewPage() {
  return (
    <div className="container page-content engine-page">
      <Link
        className="engine-back"
        href="/categorias/motor-e-componentes-internos"
      >
        ← Motor e componentes internos
      </Link>
      <EngineCatalog />
    </div>
  );
}
