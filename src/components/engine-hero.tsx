"use client";
import { useState } from "react";
import { Pause, Play } from "lucide-react";

export function EngineHero() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`engine-hero${paused ? " engine-hero-paused" : ""}`}>
      <div className="engine-hero-caption" aria-hidden="true">
        <span /> ENGENHARIA EM MOVIMENTO
      </div>
      <div
        className="engine-hero-stage"
        role="img"
        aria-label="Ilustração realista de um motor de quatro cilindros em vista explodida, com movimento suave entre cabeçote, bloco e conjunto inferior"
      >
        <div className="engine-hero-halo" />
        <div className="engine-hero-assembly">
          {(["head", "block", "crank"] as const).map((part, index) => (
            <div
              key={part}
              className={`engine-hero-layer engine-hero-${part}`}
              aria-hidden="true"
            >
              <img
                src="/images/engine-hero.webp"
                srcSet="/images/engine-hero-mobile.webp 640w, /images/engine-hero.webp 1024w"
                sizes="(max-width: 800px) 100vw, 60vw"
                alt=""
                width={1024}
                height={1024}
                loading="eager"
                fetchPriority={index === 0 ? "high" : "auto"}
                draggable={false}
              />
            </div>
          ))}
        </div>
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
        Ilustração por IA · movimento ilustrativo
      </span>
    </div>
  );
}
