"use client";
import { useRef, useState } from "react";
import { Check, Copy, Heart } from "lucide-react";
import type { PixBeneficiary } from "@/lib/pix";
export function PixDonation({
  beneficiary,
  payload,
  qrDataUrl,
}: {
  beneficiary: PixBeneficiary;
  payload: string;
  qrDataUrl: string;
}) {
  const [message, setMessage] = useState(""),
    [copied, setCopied] = useState<"key" | "code" | null>(null);
  const keyField = useRef<HTMLInputElement>(null),
    codeField = useRef<HTMLTextAreaElement>(null);
  async function copy(kind: "key" | "code") {
    try {
      await navigator.clipboard.writeText(
        kind === "key" ? beneficiary.phone : payload,
      );
      setCopied(kind);
      setMessage(
        kind === "key"
          ? "Chave Pix copiada."
          : "Código Pix Copia e Cola copiado.",
      );
    } catch {
      setCopied(null);
      const field = kind === "key" ? keyField.current : codeField.current;
      field?.focus();
      field?.select();
      setMessage(
        "A cópia automática não está disponível. O texto está selecionado para você copiar.",
      );
    }
  }
  return (
    <section className="pix-donation" aria-labelledby="pix-donation-title">
      <div className="pix-qr-panel">
        <div className="pix-heart">
          <Heart size={28} />
        </div>
        <h2 id="pix-donation-title">Sua contribuição movimenta o projeto.</h2>
        <p>
          Escaneie o QR Code com o aplicativo do seu banco. Você escolhe o valor
          da doação.
        </p>
        <div className="pix-qr">
          {/* QR generated locally; no beneficiary data is sent to a third-party image service. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            width={280}
            height={280}
            alt="QR Code Pix para apoiar o projeto. Se preferir, use os botões de copiar chave ou código."
          />
        </div>
        <span className="pix-amount">
          Valor livre · contribuição voluntária
        </span>
      </div>
      <div className="pix-copy-panel">
        <span className="eyebrow">APOIE O CONHECIMENTO AUTOMOTIVO</span>
        <h2>Doe via Pix</h2>
        <p>
          Ajude a manter os conteúdos e os modelos interativos do Edson Oficina.
        </p>
        <dl className="pix-beneficiary">
          <div>
            <dt>Beneficiário</dt>
            <dd>{beneficiary.name}</dd>
          </div>
          <div>
            <dt>Cidade</dt>
            <dd>{beneficiary.city}</dd>
          </div>
        </dl>
        <label htmlFor="pix-phone">Chave Pix · celular</label>
        <input
          id="pix-phone"
          ref={keyField}
          readOnly
          value={beneficiary.phone}
        />
        <button
          className="button pix-copy-button"
          type="button"
          onClick={() => copy("key")}
        >
          {copied === "key" ? <Check size={18} /> : <Copy size={18} />}Copiar
          chave Pix
        </button>
        <label htmlFor="pix-code">Pix Copia e Cola</label>
        <textarea
          id="pix-code"
          ref={codeField}
          readOnly
          value={payload}
          rows={4}
          spellCheck={false}
        />
        <button
          className="button secondary pix-copy-button"
          type="button"
          onClick={() => copy("code")}
        >
          {copied === "code" ? <Check size={18} /> : <Copy size={18} />}Copiar
          código Pix
        </button>
        <p className="pix-copy-status" role="status" aria-live="polite">
          {message}
        </p>
        <p className="pix-bank-note">
          No aplicativo do banco, informe o valor e confira o nome do
          beneficiário antes de confirmar. A conclusão e o comprovante ficam no
          banco.
        </p>
      </div>
    </section>
  );
}
