"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import {
  durationLabel,
  publicationLabel,
  shortSummary,
  videoDate,
} from "@/lib/video-presentation";
type Video = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  author: string;
  imageUrl: string;
  categories: string[];
  duration: string | null;
  metadata: unknown;
};
export function RecentVideos({ videos }: { videos: Video[] }) {
  const [topic, setTopic] = useState("todos");
  const [expanded, setExpanded] = useState(false);
  function selectTopic(value: string) {
    setTopic(value);
    setExpanded(false);
  }
  const topics = Array.from(new Set(videos.flatMap((v) => v.categories)));
  const visible =
    topic === "todos"
      ? videos
      : videos.filter((v) => v.categories.includes(topic));
  return (
    <div className="recent-videos">
      <div className="video-discovery">
        <div
          className="video-topics"
          role="group"
          aria-label="Filtrar novidades por assunto"
        >
          <button
            type="button"
            aria-pressed={topic === "todos"}
            onClick={() => selectTopic("todos")}
          >
            Todos os assuntos
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => selectTopic(t)}
            >
              {t.replaceAll("-", " ")}
            </button>
          ))}
        </div>
        <span className="video-order">↓ Publicações mais recentes</span>
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} vídeos nesta seleção
      </p>
      <div className="recent-video-grid">
        {(expanded ? visible : visible.slice(0, 6)).map((v) => {
          const date = videoDate(v.metadata),
            duration = durationLabel(v.duration);
          return (
            <Link
              className="content-card video-modern"
              href={"/videos/" + v.slug}
              key={v.id}
            >
              <div className="card-art art-video">
                {v.imageUrl ? (
                  <Image
                    unoptimized
                    src={v.imageUrl}
                    alt=""
                    width={640}
                    height={360}
                  />
                ) : (
                  <Play size={48} />
                )}
                <span className="play">
                  <Play size={20} fill="currentColor" />
                </span>
                {duration && <span className="video-duration">{duration}</span>}
              </div>
              <div className="card-copy">
                <div className="video-meta">
                  <span className="tag">
                    {v.categories[0]?.replaceAll("-", " ") || "Vídeo técnico"}
                  </span>
                  {date && (
                    <time dateTime={date}>{publicationLabel(date)}</time>
                  )}
                </div>
                <h3>{v.title}</h3>
                <p>{shortSummary(v.summary)}</p>
                <div className="card-foot">
                  <span>{v.author}</span>
                  <span className="video-watch">
                    Assistir <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {visible.length > 6 && (
        <button
          className="video-expand"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? "Mostrar menos"
            : `Mostrar mais ${visible.length - 6} vídeos`}
        </button>
      )}
      <div className="video-library-link">
        <span>Continue explorando a biblioteca técnica.</span>
        <Link href="/videos">Ver todos os vídeos →</Link>
      </div>
    </div>
  );
}
