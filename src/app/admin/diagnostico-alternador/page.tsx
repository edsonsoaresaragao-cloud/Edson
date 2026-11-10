import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlternatorDiagnosisAdmin } from "@/components/alternator-diagnosis/admin";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  if (user?.role !== "ADMIN") redirect("/admin");
  return <AlternatorDiagnosisAdmin />;
}
