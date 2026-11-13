import { createAccessHandlers } from "@/lib/page-access/handler";
import {
  productionAccessRepository,
  guardAccess,
} from "@/lib/page-access/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const { GET, POST } = createAccessHandlers({
  repository: productionAccessRepository,
  origin: () => process.env.APP_URL || "http://localhost:3000",
  guard: guardAccess,
});
