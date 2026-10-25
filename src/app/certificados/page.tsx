import { PageHeading } from "@/components/content";
export const metadata = { title: "Validar certificado" };
export default function Certificates() {
  return (
    <div className="container auth-wrap">
      <PageHeading
        title="Verifique um certificado"
        description="Digite o código de validação impresso no certificado EDSON OFICINA ACADEMY."
      />
      <form className="card form" action="/certificados/consultar">
        <label>
          Código de validação
          <input
            name="codigo"
            pattern="[A-Fa-f0-9]{24}"
            required
            maxLength={24}
          />
        </label>
        <button className="button">Consultar autenticidade</button>
      </form>
    </div>
  );
}
