import { ContactForm } from "@/components/contact";
import { PageHeading } from "@/components/content";
export const metadata = { title: "Contato" };
export default function Contact() {
  return (
    <div className="container page-content">
      <PageHeading
        title="Vamos conversar"
        description="Dúvidas, sugestões e solicitações sobre a EDSON OFICINA."
      />
      <div className="grid two">
        <div className="card">
          <h2>Fale com Edson</h2>
          <p>Responsável pelo portal EDSON OFICINA.</p>
          <p>Fortaleza, Ceará, Brasil.</p>
          <p>WhatsApp: +55 85 98140-8606</p>
          <a
            className="button"
            href="https://wa.me/5585981408606?text=Ol%C3%A1%2C%20Edson!%20Conheci%20o%20site%20Edson%20Oficina%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
          >
            Conversar no WhatsApp ↗
          </a>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
