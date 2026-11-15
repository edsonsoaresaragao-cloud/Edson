import { notFound } from "next/navigation";
import { getLibraryCourse } from "@/lib/academy/library/catalog";
import { getLibraryAccess } from "@/lib/academy/library/access";
import { LibraryStudyRoom } from "@/components/academy/library/study-room";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getLibraryCourse(slug);
  return {
    title: course
      ? `${course.title} | EDSON OFICINA Academy`
      : "Aula não encontrada",
  };
}

export default async function LibraryLesson({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getLibraryCourse(slug)) notFound();
  const access = await getLibraryAccess(slug);
  if (!access) notFound();
  return <LibraryStudyRoom {...access} />;
}
