"use client";

import { useState } from "react";
import { YouTubePlayer } from "./player";

type Video = {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  imageUrl: string;
};

export function YouTubeGallery({ videos }: { videos: Video[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = videos.find((video) => video.id === selectedId) || videos[0];
  if (!selected) return null;
  return (
    <section aria-label="Vídeos do YouTube">
      <h2>{selected.title}</h2>
      <YouTubePlayer
        key={selected.youtubeId}
        id={selected.youtubeId}
        title={selected.title}
      />
      <p className="credit">
        Fonte: {selected.author}. Se a reprodução estiver indisponível,{" "}
        <a
          href={`https://www.youtube.com/watch?v=${selected.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          assistir no YouTube ↗
        </a>
        .
      </p>
      <div className="grid three">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            className="content-card"
            aria-pressed={video.id === selected.id}
            onClick={() => setSelectedId(video.id)}
          >
            <div className="card-art art-video">
              {/* YouTube thumbnails are served directly, without copying videos. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  video.imageUrl ||
                  `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
                }
                alt=""
                loading="lazy"
                width={640}
                height={360}
              />
            </div>
            <div className="card-copy">
              <h3>{video.title}</h3>
              <span>
                {video.id === selected.id
                  ? "Selecionado"
                  : "Assistir nesta página"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
