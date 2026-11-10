import { db } from "@/lib/db";
import { requireUser, assertOrigin, rateLimit } from "@/lib/auth";
import { caseHandler } from "@/lib/alternator-diagnosis/handlers";
import { createDiagnosticStore } from "@/lib/alternator-diagnosis/store";
export const dynamic = "force-dynamic";
const handler = caseHandler(
  createDiagnosticStore(db),
  async (request, write) => {
    if (write) assertOrigin(request);
    const user = await requireUser();
    await rateLimit(`alternator:${user.id}`, 60, 60);
    return user;
  },
);
export const GET = handler,
  POST = handler,
  PUT = handler,
  DELETE = handler;
