import { createAccessHandlers } from "@/lib/page-access/handler";
import {
  productionAccessRepository,
  guardAccess,
  accessOrigin,
} from "@/lib/page-access/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const { GET, POST } = createAccessHandlers({
  repository: productionAccessRepository,
  origin: accessOrigin,
  guard: guardAccess,
});
