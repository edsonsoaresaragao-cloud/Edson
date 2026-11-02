import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "qrcode";
import {
  createPixPayload,
  normalizePixPhone,
  pixCrc,
  getPixBeneficiary,
} from "../src/lib/pix";
import { PixDonation } from "../src/components/pix-donation";
// Synthetic data for encoding only, never exposed as a live donation destination.
const beneficiary = {
  phone: "11900000000",
  name: "BENEFICIARIO DE TESTE",
  city: "CIDADE TESTE",
};
function fields(payload: string) {
  const result = new Map<string, string>();
  let offset = 0;
  while (offset < payload.length) {
    const id = payload.slice(offset, offset + 2),
      length = Number(payload.slice(offset + 2, offset + 4));
    assert.ok(Number.isInteger(length));
    const value = payload.slice(offset + 4, offset + 4 + length);
    assert.equal(value.length, length);
    assert.ok(!result.has(id));
    result.set(id, value);
    offset += 4 + length;
  }
  assert.equal(offset, payload.length);
  return result;
}
test("celular Pix usa E.164 e rejeita DDD isolado ou número incompleto", () => {
  assert.equal(normalizePixPhone("(11) 90000-0000"), "+5511900000000");
  assert.equal(normalizePixPhone("+55 11 90000-0000"), "+5511900000000");
  for (const invalid of [
    "85",
    "",
    "1191234567",
    "11900000000abc",
    "+1 11900000000",
  ])
    assert.throws(() => normalizePixPhone(invalid));
});
test("CRC corresponde ao vetor CCITT-FALSE conhecido", () =>
  assert.equal(pixCrc("123456789"), "29B1"));
test("BR Code estático contém chave, nome, cidade, moeda e CRC, sem valor fixo", () => {
  const payload = createPixPayload(beneficiary),
    data = fields(payload),
    account = fields(data.get("26")!);
  assert.equal(data.get("00"), "01");
  assert.equal(data.get("01"), "11");
  assert.equal(account.get("00"), "br.gov.bcb.pix");
  assert.equal(account.get("01"), "+5511900000000");
  assert.equal(data.get("53"), "986");
  assert.equal(data.get("58"), "BR");
  assert.equal(data.get("59"), beneficiary.name);
  assert.equal(data.get("60"), beneficiary.city);
  assert.equal(data.get("54"), undefined);
  assert.equal(fields(data.get("62")!).get("05"), "***");
  assert.equal(data.get("63"), pixCrc(payload.slice(0, -4)));
});
test("nome e cidade são normalizados, limitados e obrigatórios; configuração parcial não ativa Pix", () => {
  const data = fields(
    createPixPayload({
      ...beneficiary,
      name: "José da Silva & Família com nome muito comprido",
      city: "São José dos Campos",
    }),
  );
  assert.equal(data.get("59")!.length, 25);
  assert.ok(data.get("60")!.length <= 15);
  assert.ok(!/[éã&]/.test(data.get("59")!));
  assert.throws(() => createPixPayload({ ...beneficiary, name: "  " }));
  assert.equal(getPixBeneficiary({ PIX_PHONE: "85" }), null);
  assert.equal(
    getPixBeneficiary({
      PIX_PHONE: beneficiary.phone,
      PIX_BENEFICIARY: "Titular",
    }),
    null,
  );
  assert.deepEqual(
    getPixBeneficiary({
      PIX_PHONE: beneficiary.phone,
      PIX_BENEFICIARY: beneficiary.name,
      PIX_CITY: beneficiary.city,
    }),
    { ...beneficiary, phone: "+5511900000000" },
  );
});
test("QR é gerado localmente e HTML oferece chave, código e beneficiário sem afirmar pagamento", async () => {
  const payload = createPixPayload(beneficiary);
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 560,
  });
  assert.ok(qrDataUrl.startsWith("data:image/png;base64,"));
  const html = renderToStaticMarkup(
    createElement(PixDonation, {
      beneficiary: {
        ...beneficiary,
        phone: normalizePixPhone(beneficiary.phone),
      },
      payload,
      qrDataUrl,
    }),
  );
  assert.ok(html.includes(payload));
  assert.ok(html.includes(beneficiary.name));
  assert.ok(html.includes("Copiar chave Pix"));
  assert.ok(html.includes("Copiar código Pix"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(!html.includes("Pagamento confirmado"));
});

test("destinatário confirmado ativa a página sem exigir variáveis no Render", async () => {
  const actual = getPixBeneficiary({});
  assert.deepEqual(actual, {
    phone: "+5585981408606",
    name: "Edson Aragão",
    city: "Fortaleza",
  });
  assert.deepEqual(
    getPixBeneficiary({ PIX_PHONE: "", PIX_BENEFICIARY: " ", PIX_CITY: "" }),
    actual,
  );
  const payload = createPixPayload(actual!);
  const data = fields(payload);
  assert.equal(fields(data.get("26")!).get("01"), "+5585981408606");
  assert.equal(data.get("59"), "EDSON ARAGAO");
  assert.equal(data.get("60"), "FORTALEZA");
  assert.equal(data.get("63"), pixCrc(payload.slice(0, -4)));
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 560,
  });
  const html = renderToStaticMarkup(
    createElement(PixDonation, { beneficiary: actual!, payload, qrDataUrl }),
  );
  assert.ok(html.includes("Edson Aragão"));
  assert.ok(html.includes("+5585981408606"));
  assert.ok(html.includes(payload));
  assert.ok(qrDataUrl.startsWith("data:image/png;base64,"));
});
