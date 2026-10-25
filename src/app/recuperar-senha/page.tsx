import { ActionForm, Field } from "@/components/forms";
import { PageHeading } from "@/components/content";
export default function Recover() {
  return (
    <div className="container auth-wrap">
      <PageHeading
        title="Recuperar acesso"
        description="Enviaremos um link temporário para o e-mail associado à conta."
      />
      <ActionForm
        action="recover"
        className="card"
        submitLabel="Enviar instruções"
      >
        <Field label="E-mail" name="email" type="email" required />
      </ActionForm>
    </div>
  );
}
