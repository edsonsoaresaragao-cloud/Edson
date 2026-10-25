import Link from "next/link";
import Image from "next/image";
import type { Content } from "@prisma/client";
import { Play, ArrowUpRight, Wrench, BookOpen, ArrowRight } from "lucide-react";
import { contentUrl } from "@/lib/content";
export function SectionTitle({
  eyebrow,
  title,
  href,
  label = "Ver todos",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          {label} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function ContentCard({ item }: { item: Content }) {
  return (
    <Link href={contentUrl(item)} className="content-card">
      <div className={"card-art art-" + item.kind.toLowerCase()}>
        {item.imageUrl ? (
          <Image
            unoptimized
            src={item.imageUrl}
            alt=""
            width={640}
            height={360}
          />
        ) : (
          <>
            <div className="art-grid" />
            {item.kind === "VIDEO" ? (
              <Play size={50} />
            ) : item.kind === "PART" ? (
              <Wrench size={50} />
            ) : (
              <BookOpen size={44} />
            )}
            <span className="art-label">EDSON / CONHECIMENTO TÉCNICO</span>
          </>
        )}
        {item.kind === "VIDEO" && (
          <span className="play">
            <Play size={16} fill="currentColor" />
          </span>
        )}
      </div>
      <div className="card-copy">
        <span className="tag">
          {item.categorySlugs[0]?.replaceAll("-", " ") ||
            "Conhecimento automotivo"}
        </span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="card-foot">
          <span>{item.author}</span>
          <ArrowUpRight size={18} />
        </div>
      </div>
    </Link>
  );
}
export function Empty({
  title = "Conteúdo em preparação",
  text = "Novos conteúdos serão exibidos aqui quando publicados pelo administrador.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">
        {eyebrow || "EDSON OFICINA / CONHECIMENTO"}
      </span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
