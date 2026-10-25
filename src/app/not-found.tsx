import Link from "next/link";
import { PageHeading } from "@/components/content";
export default function NotFound() {
  return (
    <div className="container page-content">
      <PageHeading
        title="Conteúdo não encontrado"
        description="A página pode estar em preparação, oculta ou indisponível."
      />
      <Link href="/" className="button">
        Voltar ao início
      </Link>
    </div>
  );
}
