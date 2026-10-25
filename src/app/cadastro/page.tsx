import Link from "next/link";
import { ActionForm, Field } from "@/components/forms";
import { PageHeading } from "@/components/content";
export const metadata = { title: "Criar conta" };
export default function Register() {
  return (
    <div className="container auth-wrap">
      <PageHeading
        title="Seu próximo passo começa aqui."
        description="Crie sua conta gratuita na EDSON OFICINA ACADEMY."
      />
      <ActionForm action="register" className="card" submitLabel="Criar conta">
        <Field label="Nome completo" name="name" required />
        <Field label="E-mail" name="email" type="email" required />
        <Field
          label="Senha (mínimo 12 caracteres)"
          name="password"
          type="password"
          required
        />
        <label className="check">
          <input type="checkbox" name="consent" required />
          Li e aceito os termos de uso e a política de privacidade para a
          criação da conta.
        </label>
        <p className="muted">
          <Link href="/termos">Termos de uso</Link> ·{" "}
          <Link href="/privacidade">Política de privacidade</Link>
        </p>
      </ActionForm>
      <p className="auth-links">
        <Link href="/login">Já tenho uma conta</Link>
      </p>
    </div>
  );
}
