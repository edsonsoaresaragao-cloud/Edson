import { z } from "zod";
export const emailSchema = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase().trim());
export const passwordSchema = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .refine(
    (s) => Buffer.byteLength(s, "utf8") <= 72,
    "Use até 72 bytes na senha.",
  );
export const safeUrl = z.union([
  z.literal(""),
  z.url().refine((s) => s.startsWith("https://"), "Use HTTPS."),
]);
export const contentSchema = z.object({
  kind: z.enum(["VIDEO", "PART", "DIAGNOSIS", "GUIDE", "ARTICLE", "VEHICLE"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  instructor: z.string().max(120),
  difficulty: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(10).max(700),
  body: z.string().max(100000),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "SCHEDULED"]),
  author: z.string().trim().min(1).max(120),
  imageUrl: safeUrl,
  sourceUrl: safeUrl,
  brand: z.string().max(80),
  vehicleModel: z.string().max(80),
  year: z.union([z.literal(""), z.coerce.number().int().min(1900).max(2100)]),
  youtubeId: z.string().regex(/^$|^[\w-]{11}$/),
  categorySlugs: z.array(z.string().max(100)).max(34),
  tags: z.array(z.string().max(60)).max(30),
  publishAt: z.string(),
});
export function parseJson<T>(value: string, schema: z.ZodType<T>): T {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("JSON inválido.");
  }
  return schema.parse(parsed);
}
export const courseSchema = z.object({
  imageUrl: safeUrl,
  categorySlugs: z.array(z.string().max(100)).max(100),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(10000),
  instructor: z.string().min(2).max(120),
  hours: z.coerce.number().int().min(1).max(2000),
  passingScore: z.coerce.number().int().min(1).max(100),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
  objectives: z.string().max(10000),
  audience: z.string().max(2000),
  prerequisites: z.string().max(2000),
});
export const modulesSchema = z
  .array(
    z.object({
      title: z.string().min(2).max(160),
      lessons: z
        .array(
          z.object({
            title: z.string().min(2).max(180),
            body: z.string().min(10).max(100000),
            youtubeId: z
              .string()
              .regex(/^$|^[\w-]{11}$/)
              .optional(),
            videoContentId: z.string().max(60).optional(),
            questions: z
              .array(
                z
                  .object({
                    prompt: z.string().min(3).max(1000),
                    options: z.array(z.string().min(1).max(500)).min(2).max(6),
                    correctIndex: z.number().int().min(0),
                  })
                  .refine((q) => q.correctIndex < q.options.length),
              )
              .max(30),
          }),
        )
        .min(1)
        .max(100),
    }),
  )
  .min(1)
  .max(50);
