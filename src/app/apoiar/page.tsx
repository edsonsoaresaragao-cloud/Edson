import Link from "next/link";
import QRCode from "qrcode";
import { Heart } from "lucide-react";
import { PixDonation } from "@/components/pix-donation";
import { getPixBeneficiary, createPixPayload } from "@/lib/pix";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Apoie o projeto com Pix",
  description:
    "Contribua voluntariamente com o projeto Edson Oficina por Pix. Escolha o valor no aplicativo do seu banco.",
};
export default async function SupportPage() {
  const beneficiary = getPixBeneficiary(process.env);
  const payload = beneficiary ? createPixPayload(beneficiary) : null;
  const qrDataUrl = payload
    ? await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 560,
        color: { dark: "#0b1726", light: "#ffffff" },
      })
    : null;
  return (
    <div className="container page-content pix-page">
      <Link className="compressor-back" href="/">
        ← Voltar ao início
      </Link>
      <header className="page-heading">
        <span className="eyebrow">EDSON OFICINA / APOIE O PROJETO</span>
        <h1>Conhecimento que vai mais longe.</h1>
        <p>
          Sua doação ajuda a continuar criando conteúdos e experiências
          interativas sobre mecânica.
        </p>
      </header>
      {beneficiary && payload && qrDataUrl ? (
        <PixDonation
          beneficiary={beneficiary}
          payload={payload}
          qrDataUrl={qrDataUrl}
        />
      ) : (
        <section className="pix-unavailable">
          <Heart size={28} />
          <h2>Obrigado por querer apoiar.</h2>
          <p>As doações via Pix estarão disponíveis em breve.</p>
          <Link className="button" href="/videos">
            Explorar conteúdos
          </Link>
        </section>
      )}
    </div>
  );
}
