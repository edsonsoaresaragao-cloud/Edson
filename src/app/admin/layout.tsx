import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { ActionForm } from "@/components/forms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};
const menu = [
  ["", "Dashboard"],
  ["conteudos", "Todos os conteúdos"],
  ["conteudos?kind=VIDEO", "Vídeos"],
  ["uploads", "Enviar vídeo / apostila"],
  ["youtube", "Importar YouTube"],
  ["categorias", "Categorias"],
  ["conteudos?kind=PART", "Peças"],
  ["conteudos?kind=DIAGNOSIS", "Diagnósticos"],
  ["conteudos?kind=GUIDE", "Guias"],
  ["conteudos?kind=ARTICLE", "Artigos"],
  ["conteudos?kind=VEHICLE", "Marcas e modelos"],
  ["cursos", "Treinamentos, cursos e aulas"],
  ["alunos", "Alunos e matrículas"],
  ["certificados", "Certificados"],
  ["mensagens", "Mensagens"],
  ["usuarios", "Usuários"],
  ["configuracoes", "Configurações"],
  ["sincronizacoes", "Sincronizações e tarefas"],
  ["logs", "Logs administrativos"],
];
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "EDITOR"].includes(user.role)) redirect("/aluno");
  return (
    <div className="container admin-shell">
      <aside className="admin-nav">
        <h2>
          Painel de Edson<span className="orange">.</span>
        </h2>
        <div>
          {menu
            .filter(
              ([path]) =>
                user.role === "ADMIN" ||
                ![
                  "alunos",
                  "certificados",
                  "mensagens",
                  "usuarios",
                  "configuracoes",
                  "sincronizacoes",
                  "logs",
                  "youtube",
                ].includes(path),
            )
            .map(([path, label]) => (
              <Link href={"/admin" + (path ? "/" + path : "")} key={path}>
                {label}
              </Link>
            ))}
        </div>
        <hr className="divider" />
        <ActionForm action="logout" submitLabel="Sair" />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
