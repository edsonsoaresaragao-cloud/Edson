import { z } from "zod";
import { caseSchema, entrySchema, type DiagnosticCase } from "./schema";
import { reportReady } from "./rules";
export type CaseRow = {
  id: string;
  data: DiagnosticCase;
  revision: number;
  updatedAt: Date | string;
  createdAt: Date | string;
};
export type Store = {
  validateReference?: (data: DiagnosticCase) => Promise<string>;
  list: (owner: string) => Promise<unknown>;
  get: (id: string, owner: string) => Promise<CaseRow | undefined>;
  create: (owner: string, data: DiagnosticCase) => Promise<CaseRow>;
  update: (
    id: string,
    owner: string,
    revision: number,
    data: DiagnosticCase,
  ) => Promise<CaseRow | undefined>;
  remove: (id: string, owner: string) => Promise<boolean>;
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function readJson(request: Request) {
  const raw = await request.text();
  if (raw.length > 150000)
    throw Object.assign(new Error("Registro muito grande."), { status: 413 });
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("JSON inválido."), { status: 400 });
  }
}
export function apiError(e: unknown) {
  if (e instanceof z.ZodError)
    return json(
      {
        error: e.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n"),
      },
      400,
    );
  const status =
    e && typeof e === "object" && "status" in e ? Number(e.status) : 500;
  return json(
    {
      error:
        status < 500 && e instanceof Error
          ? e.message
          : "Não foi possível acessar o armazenamento. Tente novamente.",
    },
    status,
  );
}
export function caseHandler(
  store: Store,
  guard: (request: Request, write: boolean) => Promise<{ id: string }>,
) {
  return async (request: Request) => {
    try {
      const user = await guard(request, request.method !== "GET");
      const id = new URL(request.url).searchParams.get("id");
      if (request.method === "GET") {
        if (!id) return json({ cases: await store.list(user.id) });
        z.string().uuid().parse(id);
        const row = await store.get(id, user.id);
        return row
          ? json(row)
          : json({ error: "Diagnóstico não encontrado." }, 404);
      }
      if (request.method === "DELETE") {
        z.string().uuid().parse(id);
        return (await store.remove(id!, user.id))
          ? json({ ok: true })
          : json({ error: "Diagnóstico não encontrado." }, 404);
      }
      const payload = z
        .object({
          id: z.string().uuid().optional(),
          revision: z.number().int().positive().optional(),
          data: caseSchema,
        })
        .strict()
        .parse(await readJson(request));
      const referenceIssue =
        payload.data.reference.origin === "admin"
          ? (await store.validateReference?.(payload.data)) ||
            (!store.validateReference
              ? "Referência administrativa não verificada."
              : "")
          : "";
      if (referenceIssue) return json({ error: referenceIssue }, 400);
      const issue = reportReady(payload.data);
      if (issue) return json({ error: issue }, 400);
      if (request.method === "POST")
        return json(await store.create(user.id, payload.data), 201);
      if (request.method === "PUT" && payload.id && payload.revision) {
        const row = await store.update(
          payload.id,
          user.id,
          payload.revision,
          payload.data,
        );
        return row
          ? json(row)
          : json(
              {
                error:
                  "Registro alterado ou indisponível. Reabra a versão salva antes de substituir.",
              },
              409,
            );
      }
      return json({ error: "Operação inválida." }, 400);
    } catch (e) {
      return apiError(e);
    }
  };
}
export const parseEntry = (value: unknown) => entrySchema.parse(value);

export type ReferenceStore = {
  list: (admin: boolean) => Promise<unknown>;
  save: (
    entry: ReturnType<typeof parseEntry>,
    actor: string,
  ) => Promise<string>;
  remove: (id: string, actor: string) => Promise<void>;
};
export function referenceHandler(
  store: ReferenceStore,
  guard: (request: Request, write: boolean) => Promise<{ id: string }>,
) {
  return async (request: Request) => {
    try {
      const privateRead =
        request.method === "GET" &&
        new URL(request.url).searchParams.get("admin") === "1";
      const user =
        request.method === "GET" && !privateRead
          ? null
          : await guard(request, request.method !== "GET");
      if (request.method === "GET")
        return json({ entries: await store.list(privateRead) });
      if (request.method === "POST") {
        const entry = parseEntry(await readJson(request));
        return json({ id: await store.save(entry, user!.id) });
      }
      if (request.method === "DELETE") {
        const id = z
          .string()
          .uuid()
          .parse(new URL(request.url).searchParams.get("id"));
        await store.remove(id, user!.id);
        return json({ ok: true });
      }
      return json({ error: "Operação inválida." }, 405);
    } catch (e) {
      return apiError(e);
    }
  };
}
