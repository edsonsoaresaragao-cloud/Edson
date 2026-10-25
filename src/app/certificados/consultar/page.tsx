import { redirect } from "next/navigation";
export default async function Lookup({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  redirect(
    "/certificados/" + encodeURIComponent((codigo || "invalido").toUpperCase()),
  );
}
