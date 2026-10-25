import { ActionForm, Field } from "@/components/forms";
import { PageHeading } from "@/components/content";
export default async function Reset({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container auth-wrap">
      <PageHeading title="Redefinir senha" />
      <ActionForm
        action="reset"
        className="card"
        submitLabel="Salvar nova senha"
      >
        <input type="hidden" name="token" value={token || ""} />
        <Field
          label="Nova senha (mínimo 12 caracteres)"
          name="password"
          type="password"
          required
        />
      </ActionForm>
    </div>
  );
}
