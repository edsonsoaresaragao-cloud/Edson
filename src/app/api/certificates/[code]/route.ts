import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const cert = await db.certificate.findUnique({ where: { code } });
  const user = await currentUser();
  if (!cert || !user || (cert.userId !== user.id && user.role !== "ADMIN"))
    return new Response("Acesso restrito", { status: 403 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 802,
    height: 555,
    borderColor: rgb(0.97, 0.45, 0.08),
    borderWidth: 3,
  });
  function line(text: string, y: number, size = 16) {
    const safe = text.replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "");
    let s = size;
    while (font.widthOfTextAtSize(safe, s) > 730) s--;
    page.drawText(safe, {
      x: (842 - font.widthOfTextAtSize(safe, s)) / 2,
      y,
      size: s,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
  }
  page.drawText("EDSON OFICINA ACADEMY", {
    x: 60,
    y: 510,
    size: 22,
    font: bold,
    color: rgb(0.06, 0.09, 0.16),
  });
  line("CERTIFICADO DE CONCLUSÃO", 425, 28);
  line("Certificamos que", 365);
  line(cert.studentName, 320, 25);
  line("concluiu o curso livre", 280);
  line(cert.courseTitle, 240, 22);
  line(
    `Carga horária: ${cert.hours} horas • Emissão: ${cert.issuedAt.toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}`,
    185,
  );
  line(
    "Curso livre. Sem alegação de reconhecimento oficial ou acadêmico.",
    125,
    12,
  );
  line(`Validação: ${process.env.APP_URL}/certificados/${cert.code}`, 85, 10);
  return new Response(new Uint8Array(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
