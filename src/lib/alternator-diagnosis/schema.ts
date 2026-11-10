import { z } from "zod";
import { inspections, measures, checkStates } from "./content";
const text = z.string().trim().max(3000);
const short = z.string().trim().max(200);
const numeric = z
  .string()
  .max(24)
  .refine(
    (s) => s === "" || /^-?\d+(?:[.,]\d+)?$/.test(s),
    "Informe número finito, sem separador de milhar.",
  );
const url = z
  .string()
  .max(1200)
  .refine(
    (s) => s === "" || (/^https:\/\//i.test(s) && URL.canParse(s)),
    "Use endereço HTTPS válido.",
  );
export const vehicleSchema = z
  .object({
    make: short,
    model: short,
    yearVersion: short,
    engine: short,
    fuel: short,
    voltage: z.enum(["12", "24", "other"]),
    otherVoltage: short,
    battery: z.enum(["convencional", "EFB", "AGM", "desconhecida"]),
    batteryAh: numeric,
    batteryCca: numeric,
    alternatorAmps: numeric,
    partCode: short,
    management: z.enum([
      "convencional",
      "PWM",
      "LIN",
      "BSS",
      "GENCOM/GENMON",
      "desconhecido",
    ]),
    km: numeric,
    history: text,
    complaint: text,
    plate: z.string().max(12),
    technician: short,
  })
  .strict();
const checkSchema = z
  .object({ status: z.enum(checkStates), note: text })
  .strict();
const measureKeys = new Set<string>(measures.map((m) => m[0]));
const checkKeys = new Set<string>(inspections.map((m) => m[0]));
export const caseSchema = z
  .object({
    schemaVersion: z.literal(1),
    vehicle: vehicleSchema,
    symptoms: z.array(z.string().regex(/^s(?:[1-9]|1[0-5])$/)).max(15),
    checks: z
      .record(z.string(), checkSchema)
      .refine(
        (s) => Object.keys(s).every((k) => checkKeys.has(k)),
        "Verificação desconhecida.",
      ),
    measurements: z
      .record(z.string(), numeric)
      .refine(
        (s) => Object.keys(s).every((k) => measureKeys.has(k)),
        "Medição desconhecida.",
      ),
    limits: z
      .record(z.string(), z.object({ min: numeric, max: numeric }).strict())
      .refine(
        (s) => Object.keys(s).every((k) => measureKeys.has(k)),
        "Limite desconhecido.",
      ),
    reference: z
      .object({
        title: short,
        url,
        application: z.string().max(1200),
        date: short,
        origin: z.enum(["technician", "admin"]),
        entryId: short,
      })
      .strict(),
    conditions: text,
    consumers: text,
    rippleUnit: z.enum(["V", "mV"]),
    rippleMethod: z.enum(["scope-pp", "meter-rms", "unknown"]),
    referenceRippleMethod: z.enum(["scope-pp", "meter-rms", "unknown"]),
    scopeSettings: text,
    dtcs: z.string().max(1500),
    module: short,
    freezeFrame: text,
    repair: text,
    parts: text,
    retest: text,
    status: z.enum(["pendente", "em análise", "confirmado", "resolvido"]),
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const [key, , unit, min, max] of measures) {
      const s = data.measurements[key];
      if (s) {
        let v = Number(s.replace(",", "."));
        if (key === "ripple" && data.rippleUnit === "mV") v /= 1000;
        if (!Number.isFinite(v) || v < min || v > max)
          ctx.addIssue({
            code: "custom",
            path: ["measurements", key],
            message: `Valor fora do domínio de entrada (${min} a ${max} ${unit}); confira a unidade.`,
          });
      }
      const limit = data.limits[key];
      for (const bound of [limit?.min, limit?.max])
        if (
          bound !== undefined &&
          bound !== "" &&
          (Number(bound.replace(",", ".")) < min ||
            Number(bound.replace(",", ".")) > max)
        )
          ctx.addIssue({
            code: "custom",
            path: ["limits", key],
            message:
              "Limite fora do domínio de entrada; confira unidade e aplicação.",
          });
      if (
        limit?.min &&
        limit.max &&
        Number(limit.min.replace(",", ".")) >
          Number(limit.max.replace(",", "."))
      )
        ctx.addIssue({
          code: "custom",
          path: ["limits", key],
          message: "Limite mínimo maior que máximo.",
        });
    }
    for (const key of [
      "km",
      "batteryAh",
      "batteryCca",
      "alternatorAmps",
    ] as const)
      if (data.vehicle[key] && Number(data.vehicle[key].replace(",", ".")) < 0)
        ctx.addIssue({
          code: "custom",
          path: ["vehicle", key],
          message: "Valor não pode ser negativo.",
        });
  });
export type DiagnosticCase = z.infer<typeof caseSchema>;
export const entrySchema = z
  .object({
    id: z.string().uuid().optional(),
    kind: z.enum([
      "variant",
      "fault",
      "test",
      "image",
      "diagram",
      "bulletin",
      "dtc",
      "video",
      "procedure",
    ]),
    title: short.min(3),
    body: text.min(10),
    url,
    sourceTitle: short.min(3),
    sourceUrl: url.refine((s) => s.length > 0, "Indique fonte."),
    sourceDate: short,
    application: short.min(3),
    vehicle: vehicleSchema.optional(),
    limits: z
      .record(z.string(), z.object({ min: numeric, max: numeric }).strict())
      .optional(),
    rippleMethod: z.enum(["scope-pp", "meter-rms", "unknown"]).optional(),
    published: z.boolean(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.kind === "variant" && (!e.vehicle || !e.limits))
      ctx.addIssue({
        code: "custom",
        message: "Aplicação exige identificação e limites.",
      });
    if (
      e.kind === "variant" &&
      e.published &&
      (!e.vehicle?.make ||
        !e.vehicle.model ||
        !e.vehicle.yearVersion ||
        !e.vehicle.engine ||
        !e.vehicle.partCode)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Publicar aplicação exige montadora, modelo, ano/versão, motor e código da peça.",
      });
    if (e.limits)
      for (const [k, v] of Object.entries(e.limits)) {
        if (!measureKeys.has(k))
          ctx.addIssue({
            code: "custom",
            message: `Medição desconhecida: ${k}`,
          });
        if (
          v.min &&
          v.max &&
          Number(v.min.replace(",", ".")) > Number(v.max.replace(",", "."))
        )
          ctx.addIssue({ code: "custom", message: `Limites invertidos: ${k}` });
      }
  });
export type TechnicalEntry = z.infer<typeof entrySchema>;
export function emptyCase(): DiagnosticCase {
  return {
    schemaVersion: 1,
    vehicle: {
      make: "",
      model: "",
      yearVersion: "",
      engine: "",
      fuel: "",
      voltage: "12",
      otherVoltage: "",
      battery: "desconhecida",
      batteryAh: "",
      batteryCca: "",
      alternatorAmps: "",
      partCode: "",
      management: "desconhecido",
      km: "",
      history: "",
      complaint: "",
      plate: "",
      technician: "",
    },
    symptoms: [],
    checks: {},
    measurements: {},
    limits: {},
    reference: {
      title: "",
      url: "",
      application: "",
      date: "",
      origin: "technician",
      entryId: "",
    },
    conditions: "",
    consumers: "",
    rippleUnit: "V",
    rippleMethod: "unknown",
    referenceRippleMethod: "unknown",
    scopeSettings: "",
    dtcs: "",
    module: "",
    freezeFrame: "",
    repair: "",
    parts: "",
    retest: "",
    status: "pendente",
  };
}
export function applicationKey(v: DiagnosticCase["vehicle"]) {
  return [
    v.make,
    v.model,
    v.yearVersion,
    v.engine,
    v.partCode,
    v.voltage,
    v.battery,
    v.management,
  ]
    .map((s) => s.trim().toLocaleLowerCase("pt-BR"))
    .join(" | ");
}
export function referenceUsable(c: DiagnosticCase) {
  return Boolean(
    c.vehicle.make &&
    c.vehicle.model &&
    c.vehicle.yearVersion &&
    c.vehicle.engine &&
    c.vehicle.partCode &&
    c.reference.title &&
    c.reference.url.startsWith("https://") &&
    c.reference.application === applicationKey(c.vehicle),
  );
}

export function administrativeReferenceIssue(
  c: DiagnosticCase,
  entry: TechnicalEntry | undefined,
) {
  if (c.reference.origin !== "admin") return "";
  if (
    !entry ||
    !entry.published ||
    entry.kind !== "variant" ||
    !entry.vehicle ||
    !entry.limits
  )
    return "Referência administrativa indisponível. Reabra a aplicação ou registre sua própria fonte.";
  if (
    applicationKey(c.vehicle) !== applicationKey(entry.vehicle) ||
    c.reference.application !== applicationKey(entry.vehicle) ||
    c.reference.title !== entry.sourceTitle ||
    c.reference.url !== entry.sourceUrl ||
    c.reference.date !== entry.sourceDate ||
    c.referenceRippleMethod !== (entry.rippleMethod || "unknown")
  )
    return "Referência administrativa incompatível com o veículo ou fonte.";
  const keys = new Set([
    ...Object.keys(c.limits),
    ...Object.keys(entry.limits),
  ]);
  for (const k of keys)
    if (
      c.limits[k]?.min !== entry.limits[k]?.min ||
      c.limits[k]?.max !== entry.limits[k]?.max
    )
      return "Limites administrativos foram alterados. Use referência informada pelo técnico.";
  return "";
}
