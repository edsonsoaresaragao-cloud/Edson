import {
  brlPrice,
  normalizePartText,
  type Offer,
  type OfferDetails,
} from "./catalog";
type Row = Record<string, unknown>;
const row = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
const str = (v: unknown, max = 300) =>
  typeof v === "string"
    ? v
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
const name = (v: unknown) => str(v) || str(row(v).name);
export function offerDetails(
  raw: unknown,
  price: number | null,
  currency: string,
): OfferDetails {
  const r = row(raw),
    p = row(r.product),
    meta = row(r.meta),
    o = row(r.offer);
  const brand = name(r.brand || p.brand || meta["product:brand"]);
  const code = str(
    r.mpn || p.mpn || r.sku || p.sku || meta["product:retailer_item_id"],
    80,
  );
  const condition = str(o.itemCondition || r.condition || p.itemCondition)
    .replace(/^https?:\/\/schema.org\//, "")
    .toLowerCase();
  const stock = str(o.availability || r.availability || p.availability)
    .replace(/^https?:\/\/schema.org\//, "")
    .toLowerCase();
  const applications = [r.applications, p.isAccessoryOrSparePartFor]
    .flatMap((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .map(name)
    .filter(Boolean)
    .slice(0, 12);
  const shipping = row(
      Array.isArray(o.shippingDetails)
        ? o.shippingDetails[0]
        : o.shippingDetails,
    ),
    rate = row(shipping.shippingRate);
  const shippingPrice = brlPrice(
    r.shipping_price ?? rate.value,
    str(r.shipping_currency || rate.currency).toUpperCase(),
  );
  const checkedDate = str(r.price_updated_at);
  return {
    brand: brand || null,
    code: code || null,
    applications,
    currency: currency === "BRL" || price !== null ? "BRL" : null,
    condition: ["newcondition", "new", "novo"].includes(condition)
      ? "new"
      : ["usedcondition", "used", "usado"].includes(condition)
        ? "used"
        : ["refurbishedcondition", "refurbished", "recondicionado"].includes(
              condition,
            )
          ? "refurbished"
          : "unknown",
    availability: ["instock", "in_stock"].includes(stock)
      ? "in_stock"
      : ["outofstock", "out_of_stock", "soldout"].includes(stock)
        ? "out_of_stock"
        : ["preorder", "presale"].includes(stock)
          ? "preorder"
          : "unknown",
    shipping: shippingPrice,
    total:
      price !== null && shippingPrice !== null
        ? Math.round((price + shippingPrice) * 100) / 100
        : null,
    compatibility: applications.length ? "declared" : "unverified",
    priceUpdatedAt:
      checkedDate &&
      Number.isFinite(Date.parse(checkedDate)) &&
      Date.parse(checkedDate) <= Date.now()
        ? new Date(checkedDate).toISOString()
        : null,
  };
}
export function comparisonKey(offer: Offer) {
  const d = offer.details;
  if (
    !d?.brand ||
    !d.code ||
    d.condition === "unknown" ||
    offer.price === null ||
    d.currency !== "BRL"
  )
    return null;
  return JSON.stringify([
    normalizePartText(d.brand),
    d.code,
    d.condition,
    d.compatibility,
    [...d.applications].sort(),
  ]);
}
export function lowestComparable(offers: Offer[]): Set<string> {
  const groups = new Map<string, Offer[]>();
  for (const o of offers) {
    const key = comparisonKey(o);
    if (key) groups.set(key, [...(groups.get(key) || []), o]);
  }
  return new Set(
    [...groups.values()]
      .filter((g) => g.length > 1)
      .flatMap((g) => {
        const min = Math.min(...g.map((o) => o.price!));
        return g.filter((o) => o.price === min).map((o) => o.id);
      }),
  );
}
