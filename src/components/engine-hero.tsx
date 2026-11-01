"use client";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { RealisticEngine } from "./realistic-engine";

export function EngineHero() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`engine-hero${paused ? " engine-hero-paused" : ""}`}>
      <div className="engine-hero-caption" aria-hidden="true">
        <span /> MOTOR EM FUNCIONAMENTO
      </div>
      <div className="engine-hero-stage engine-running-stage">
        <div className="engine-hero-halo" />
        <RealisticEngine paused={paused} />
        <div className="engine-hero-ground" />
      </div>
      <button
        type="button"
        className="engine-animation-toggle"
        onClick={() => setPaused(!paused)}
        aria-label={
          paused ? "Reproduzir animação do motor" : "Pausar animação do motor"
        }
        aria-pressed={paused}
      >
        {paused ? (
          <Play size={13} aria-hidden="true" />
        ) : (
          <Pause size={13} aria-hidden="true" />
        )}
        {paused ? "Reproduzir" : "Pausar animação"}
      </button>
      <span className="engine-hero-credit">
        Motor em corte · ciclo em câmera lenta
      </span>
    </div>
  );
}
