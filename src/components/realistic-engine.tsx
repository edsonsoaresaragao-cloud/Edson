"use client";
import { useEffect, useRef, useState } from "react";
import type { EngineRenderer } from "@/lib/engine-renderer";
import { RunningEngine } from "./running-engine";

export function RealisticEngine({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<EngineRenderer | null>(null);
  const currentPaused = useRef(paused);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/engine-renderer")
      .then(({ createEngineRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createEngineRenderer(
            host.current,
            currentPaused.current,
            () => {
              if (!cancelled) {
                controller.current = null;
                setReady(false);
              }
            },
          );
          setReady(true);
        } catch {
          // The animated cutaway remains usable when WebGL is unavailable.
          host.current.replaceChildren();
        }
      })
      .catch(() => {
        /* Retain the SVG fallback if the optional module cannot load. */
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    currentPaused.current = paused;
    controller.current?.setPaused(paused);
  }, [paused]);
  return (
    <div className="engine-realistic-view">
      <div
        ref={host}
        className="engine-webgl-host"
        role={ready ? "img" : undefined}
        aria-label={
          ready
            ? "Motor tridimensional em corte, com pistões, bielas, virabrequim, comando de válvulas e volante em funcionamento sincronizado"
            : undefined
        }
        aria-hidden={!ready}
      />
      {!ready && <RunningEngine paused={paused} />}
    </div>
  );
}
