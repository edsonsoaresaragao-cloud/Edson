import Link from "next/link";
import { ActionForm, Field } from "@/components/forms";
import { PageHeading } from "@/components/content";
export const metadata = { title: "Entrar" };
export default function Login() {
  return (
    <div className="container auth-wrap">
      <PageHeading
        title="Bom ter você por aqui."
        description="Entre para acessar os treinamentos e acompanhar seu aprendizado."
      />
      <ActionForm action="login" className="card" submitLabel="Entrar">
        <Field label="E-mail" name="email" type="email" required />
        <Field label="Senha" name="password" type="password" required />
      </ActionForm>
      <div className="auth-links">
        <Link href="/cadastro">Criar conta</Link>
        <Link href="/recuperar-senha">Esqueci minha senha</Link>
      </div>
    </div>
  );
}
