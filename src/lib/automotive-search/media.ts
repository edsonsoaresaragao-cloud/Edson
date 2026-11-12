export function imageKind(title: string, page: string) {
  const s = (title + " " + page)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/explodid|exploded/.test(s)) return "exploded";
  if (/diagrama|esquema|wiring/.test(s)) return "diagram";
  if (/conector|connector/.test(s)) return "connector";
  if (/localizacao|location/.test(s)) return "location";
  if (/\bfoto|\bphoto|fotografia/.test(s)) return "photo";
  return "other";
}
