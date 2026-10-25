import { ActionForm, Field } from "./forms";
export function ContactForm() {
  return (
    <ActionForm action="contact" submitLabel="Enviar mensagem" className="card">
      <h2>Fale com Edson</h2>
      <Field label="Nome" name="name" required />
      <Field label="E-mail" name="email" type="email" required />
      <label>
        Mensagem
        <textarea name="message" minLength={10} maxLength={5000} required />
      </label>
      <div className="honey" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="check">
        <input name="consent" type="checkbox" required />
        Autorizo o uso destes dados para responder à minha mensagem, conforme a
        política de privacidade.
      </label>
    </ActionForm>
  );
}
