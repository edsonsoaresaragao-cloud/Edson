export type PixBeneficiary = { phone: string; name: string; city: string };
/** Brazilian mobile Pix keys use E.164 (+55 + DDD + nine-digit mobile). */
export function normalizePixPhone(input: string) {
  if (!/^[+\d\s()-]+$/.test(input))
    throw new Error("Informe um celular Pix válido com DDD.");
  const digits = input.replace(/\D/g, "");
  const key = digits.length === 11 ? "+55" + digits : "+" + digits;
  if (!/^\+55[1-9]\d9\d{8}$/.test(key))
    throw new Error(
      "Informe o celular completo com DDD, cadastrado como chave Pix.",
    );
  return key;
}
function merchantText(value: string, max: number) {
  const text = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) throw new Error("Nome e cidade do beneficiário são obrigatórios.");
  return text.slice(0, max).trim();
}
function tlv(id: string, value: string) {
  const bytes = new TextEncoder().encode(value).length;
  if (bytes > 99) throw new Error("Campo Pix muito longo.");
  return id + String(bytes).padStart(2, "0") + value;
}
export function pixCrc(value: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
/** Static BR Code, without a fixed amount. The donor chooses the amount in the bank app. */
export function createPixPayload(beneficiary: PixBeneficiary) {
  const phone = normalizePixPhone(beneficiary.phone),
    name = merchantText(beneficiary.name, 25),
    city = merchantText(beneficiary.city, 15);
  const payload =
    tlv("00", "01") +
    tlv("01", "11") +
    tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", phone)) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("58", "BR") +
    tlv("59", name) +
    tlv("60", city) +
    tlv("62", tlv("05", "***")) +
    "6304";
  return payload + pixCrc(payload);
}
export function getPixBeneficiary(
  env: Record<string, string | undefined>,
): PixBeneficiary | null {
  const phone = env.PIX_PHONE?.trim(),
    name = env.PIX_BENEFICIARY?.trim(),
    city = env.PIX_CITY?.trim();
  if (!phone || !name || !city) return null;
  try {
    const result = { phone: normalizePixPhone(phone), name, city };
    createPixPayload(result);
    return result;
  } catch {
    return null;
  }
}
