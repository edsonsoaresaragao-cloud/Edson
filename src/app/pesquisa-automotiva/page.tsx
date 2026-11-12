import { AutomotiveSearch } from "@/components/automotive-search/search";
export const metadata = {
  title: "Pesquisa automotiva inteligente | EDSON OFICINA",
  description:
    "Pesquise peças, sintomas, códigos, imagens, vídeos e fontes técnicas automotivas.",
};
export default function Page() {
  return (
    <div className="container page-content">
      <AutomotiveSearch />
    </div>
  );
}
