import { z } from "zod";

export type LibraryCourse = {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
  expectedPages: number;
  hours: number | null;
  category: string;
  difficulty: string;
};

export const libraryPageSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  transcript: z.array(z.string()).default([]),
  description: z
    .string()
    .default("Descrição da imagem pendente de conferência."),
  review: z.enum(["pending", "verified"]).default("pending"),
  manufacturer: z.string().optional(),
  engine: z.string().optional(),
  models: z.array(z.string()).optional(),
  guide: z.union([z.string(), z.number()]).transform(String).optional(),
  part: z.union([z.string(), z.number()]).transform(String).optional(),
  topics: z.array(z.string()).optional(),
  teacher: z.array(z.string()).optional(),
  reviewNotes: z.array(z.string()).optional(),
  image: z.string().optional(),
  preview: z.string().optional(),
  sourceSha256: z.string().optional(),
  previewSha256: z.string().optional(),
});

export const libraryQuestionSchema = z.object({
  id: z.string().min(1).max(80),
  step: z.string().min(1).max(40),
  pages: z.array(z.number().int().positive()).min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().min(1),
  review: z.enum(["pending", "verified"]).default("pending"),
});

export const libraryDocumentSchema = z.object({
  courseNumber: z.number().int(),
  pageCount: z.number().int().positive(),
  originalSha256: z.string().regex(/^[a-f0-9]{64}$/),
  technicalReview: z.enum(["pending", "verified"]).default("pending"),
  adaptedFilename: z.string().optional(),
  adaptedSha256: z.string().optional(),
  reviewNotes: z.array(z.string()).optional(),
  pages: z.array(libraryPageSchema),
  questions: z.array(libraryQuestionSchema).default([]),
});

export type LibraryPage = z.infer<typeof libraryPageSchema>;
export type LibraryQuestion = z.infer<typeof libraryQuestionSchema>;
export type LibraryDocument = z.infer<typeof libraryDocumentSchema>;
export type PublicLibraryDocument = Omit<LibraryDocument, "questions">;
export type LibraryPublicationStatus = {
  ready: boolean;
  reasons: string[];
  receivedPages: number;
  reviewedPages: number;
};
export type LibraryAuthorization = {
  confirmed: boolean;
  scope: number[];
  statement?: string;
  confirmedAt?: string;
};
