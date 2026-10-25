import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ActionForm } from "@/components/forms";
import { PageHeading } from "@/components/content";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/jsonld";
export const dynamic = "force-dynamic";
export default async function Course({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
  });
  if (!c) notFound();
  const user = await currentUser();
  return (
    <div className="container page-content course-detail">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: c.title,
          description: c.description,
          provider: {
            "@type": "Organization",
            name: "EDSON OFICINA",
            url: process.env.APP_URL,
          },
        }}
      />
      {c.imageUrl && (
        <Image
          unoptimized
          src={c.imageUrl}
          alt={c.title}
          width={1200}
          height={600}
          className="course-cover"
        />
      )}
      <PageHeading
        eyebrow="EDSON OFICINA ACADEMY / TREINAMENTO GRATUITO"
        title={c.title}
        description={c.description}
      />
      <div className="card">
        <p>
          Instrutor: {c.instructor} · {c.hours} horas · Gratuito
        </p>
        <h3>O que você vai aprender</h3>
        <p className="prose">
          {c.objectives || "Consulte os módulos e as aulas abaixo."}
        </p>
        <h3>Público-alvo</h3>
        <p>
          {c.audience || "Pessoas interessadas em conhecimento automotivo."}
        </p>
        <h3>Pré-requisitos</h3>
        <p>{c.prerequisites || "Não informados pelo instrutor."}</p>
        {user ? (
          <ActionForm action="enroll" submitLabel="Matricular e acessar aulas">
            <input type="hidden" name="id" value={c.id} />
          </ActionForm>
        ) : (
          <Link className="button" href="/login">
            Entre para se matricular →
          </Link>
        )}
      </div>
      <h2>Conteúdo do treinamento</h2>
      {c.modules.map((m) => (
        <div className="card mb-4" key={m.id}>
          <h3>{m.title}</h3>
          {m.lessons.map((l, i) => (
            <p key={l.id}>
              {i + 1}. {l.title}
            </p>
          ))}
        </div>
      ))}
      <p className="notice">
        Certificado disponível após concluir todas as aulas e atingir{" "}
        {c.passingScore}% em cada questionário. Curso livre, sem alegação de
        reconhecimento oficial.
      </p>
    </div>
  );
}
