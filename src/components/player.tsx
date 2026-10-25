"use client";
import { useEffect, useRef } from "react";
import Hls from "hls.js";
export function VideoPlayer({ mediaId }: { mediaId: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const src = `/api/media/${mediaId}/master.m3u8`;
    if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = src;
    else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [mediaId]);
  return (
    <video
      ref={ref}
      className="video"
      controls
      preload="metadata"
      poster={`/api/media/${mediaId}/thumbnail.jpg`}
    />
  );
}
export function YouTubePlayer({ id, title }: { id: string; title: string }) {
  return (
    <iframe
      className="video"
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
