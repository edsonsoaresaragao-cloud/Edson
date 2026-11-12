import { db } from "@/lib/db";
import { requireUser, assertOrigin, rateLimit } from "@/lib/auth";
import { automotiveStore } from "@/lib/automotive-search/store";
import { createHistoryHandler } from "@/lib/automotive-search/history-handler";
export const dynamic = "force-dynamic";
const handler = createHistoryHandler(
  automotiveStore(db),
  async (request, write) => {
    if (write) assertOrigin(request);
    const user = await requireUser();
    await rateLimit("automotive:history:" + user.id, 30, 60);
    return user;
  },
);
export const GET = handler,
  POST = handler,
  DELETE = handler;
