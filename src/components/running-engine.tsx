"use client";
import { useEffect, useId, useRef } from "react";
import { engineMotion, strokeNames } from "@/lib/engine-motion";

export function RunningEngine({ paused }: { paused: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const angle = useRef(0);
  const uid = useId().replace(/:/g, "");
  const fill = (name: string) => `url(#${uid}-${name})`;
  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const pistons = [...root.querySelectorAll<SVGGElement>("[data-piston]")];
    const rods = [...root.querySelectorAll<SVGLineElement>("[data-rod]")];
    const throws = [...root.querySelectorAll<SVGGElement>("[data-throw]")];
    const arms = [...root.querySelectorAll<SVGLineElement>("[data-crank-arm]")];
    const chambers = [
      ...root.querySelectorAll<SVGRectElement>("[data-chamber]"),
    ];
    const labels = [...root.querySelectorAll<SVGTextElement>("[data-stroke]")];
    const valves = [...root.querySelectorAll<SVGGElement>("[data-valve]")];
    const flywheel = root.querySelector<SVGGElement>("[data-flywheel]");
    const cam = root.querySelector<SVGGElement>("[data-cam]");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      previous = 0;
    function draw() {
      for (let i = 0; i < 4; i++) {
        const m = engineMotion(angle.current, i);
        pistons[i].setAttribute(
          "transform",
          `translate(${m.centerX},${m.wristY})`,
        );
        rods[i].setAttribute("x1", String(m.centerX));
        rods[i].setAttribute("y1", String(m.wristY));
        rods[i].setAttribute("x2", String(m.pinX));
        rods[i].setAttribute("y2", String(m.pinY));
        arms[i].setAttribute("x2", String(m.pinX));
        arms[i].setAttribute("y2", String(m.pinY));
        throws[i].setAttribute("transform", `translate(${m.pinX},${m.pinY})`);
        const color = ["#f38a26", "#a8b2be", "#5da9de", "#dbad5b"][m.stroke];
        chambers[i].setAttribute("fill", color);
        chambers[i].setAttribute("height", String(Math.max(0, m.wristY - 214)));
        chambers[i].setAttribute(
          "opacity",
          String(0.14 + 0.2 * Math.sin(m.progress * Math.PI)),
        );
        labels[i].textContent = strokeNames[m.stroke];
        labels[i].setAttribute("fill", color);
        for (let v = 0; v < 2; v++) {
          const open =
            m.stroke === (v === 0 ? 2 : 1)
              ? Math.sin(m.progress * Math.PI) * 7
              : 0;
          valves[i * 2 + v].setAttribute("transform", `translate(0,${open})`);
        }
      }
      flywheel?.setAttribute(
        "transform",
        `rotate(${(angle.current * 180) / Math.PI} 614 360)`,
      );
      cam?.setAttribute(
        "transform",
        `rotate(${(angle.current * 90) / Math.PI} 595 149)`,
      );
    }
    function tick(now: number) {
      if (previous && !document.hidden)
        angle.current += (Math.min(now - previous, 50) * Math.PI) / 2000;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    }
    function syncMotion() {
      cancelAnimationFrame(frame);
      previous = 0;
      draw();
      if (!paused && !preference.matches) frame = requestAnimationFrame(tick);
    }
    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", syncMotion);
    };
  }, [paused]);
  return (
    <svg
      ref={svg}
      viewBox="0 0 720 490"
      role="img"
      aria-label="Motor de quatro cilindros em corte: pistões e bielas ligados ao virabrequim, válvulas e volante em movimento. Ciclo de quatro tempos em velocidade didática."
    >
      <defs>
        <linearGradient id={`${uid}-block`} x2="1" y2="1">
          <stop stopColor="#d5dde4" />
          <stop offset=".3" stopColor="#7c8d9d" />
          <stop offset=".6" stopColor="#b0beca" />
          <stop offset="1" stopColor="#3e5265" />
        </linearGradient>
        <linearGradient id={`${uid}-piston`}>
          <stop stopColor="#526678" />
          <stop offset=".3" stopColor="#dfe7ed" />
          <stop offset=".5" stopColor="#f6fafc" />
          <stop offset=".72" stopColor="#a2b3bf" />
          <stop offset="1" stopColor="#405568" />
        </linearGradient>
        <linearGradient id={`${uid}-rod`}>
          <stop stopColor="#3f5365" />
          <stop offset=".5" stopColor="#d7e2e9" />
          <stop offset="1" stopColor="#526679" />
        </linearGradient>
        <linearGradient id={`${uid}-dark`} x2="0" y2="1">
          <stop stopColor="#34495c" />
          <stop offset=".5" stopColor="#172a3d" />
          <stop offset="1" stopColor="#071726" />
        </linearGradient>
        <radialGradient id={`${uid}-wheel`}>
          <stop stopColor="#e3eaf0" />
          <stop offset=".3" stopColor="#465d70" />
          <stop offset=".8" stopColor="#8093a3" />
          <stop offset="1" stopColor="#233c50" />
        </radialGradient>
      </defs>
      <ellipse cx="363" cy="465" rx="264" ry="12" fill="#020a15" opacity=".6" />
      <path
        d="M66 166L102 135H554L577 166V415L544 441H84L66 418Z"
        fill={fill("block")}
        stroke="#b0bfcb"
        strokeWidth="2"
      />
      <path d="M577 166L606 143V402L577 415Z" fill="#34495d" stroke="#8598a9" />
      <rect
        x="77"
        y="174"
        width="488"
        height="240"
        rx="12"
        fill={fill("dark")}
        stroke="#c4d0da"
        strokeWidth="3"
      />
      <path
        d="M86 415H553L534 450H106Z"
        fill={fill("block")}
        stroke="#8397a9"
        strokeWidth="3"
      />
      <path d="M105 430H532" stroke="#2e455a" strokeWidth="8" />
      {[0, 1, 2, 3].map((i) => {
        const x = 125 + i * 112,
          m = engineMotion(0, i);
        return (
          <g key={i}>
            <rect
              x={x - 44}
              y="185"
              width="88"
              height="131"
              rx="8"
              fill="#0b1e2e"
              stroke="#8497a8"
              strokeWidth="4"
            />
            <path
              d={`M${x - 39} 189v120M${x + 39} 189v120`}
              stroke="#d4dfe8"
              strokeWidth="3"
              opacity=".7"
            />
            <rect
              data-chamber
              x={x - 36}
              y="184"
              width="72"
              height={m.wristY - 214}
              fill="#f38a26"
              opacity=".2"
            />
            <circle
              cx={x}
              cy="360"
              r="34"
              fill={fill("wheel")}
              stroke="#8ba0b0"
              strokeWidth="2"
            />
            <line
              data-crank-arm
              x1={x}
              y1="360"
              x2={m.pinX}
              y2={m.pinY}
              stroke={fill("rod")}
              strokeWidth="18"
              strokeLinecap="round"
            />
            <line
              data-rod
              x1={x}
              y1={m.wristY}
              x2={m.pinX}
              y2={m.pinY}
              stroke={fill("rod")}
              strokeWidth="16"
            />
            <g data-piston transform={`translate(${x},${m.wristY})`}>
              <rect
                x="-35"
                y="-30"
                width="70"
                height="43"
                rx="5"
                fill={fill("piston")}
                stroke="#c9d4df"
              />
              <path
                d="M-34-23H34M-34-18H34M-34-13H34"
                stroke="#25394b"
                strokeWidth="2"
              />
              <ellipse
                cy="-30"
                rx="35"
                ry="5"
                fill="#d9e3ea"
                stroke="#90a4b4"
              />
              <circle r="7" fill="#294254" stroke="#b9cbd7" strokeWidth="3" />
            </g>
            <g data-throw transform={`translate(${m.pinX},${m.pinY})`}>
              <circle
                r="14"
                fill={fill("rod")}
                stroke="#283f52"
                strokeWidth="4"
              />
              <circle r="5" fill="#d9e4eb" />
            </g>
            {[0, 1].map((v) => (
              <g data-valve key={v}>
                <path
                  d={`M${x - 19 + v * 38} 156v28`}
                  stroke="#d3e0e9"
                  strokeWidth="5"
                />
                <ellipse
                  cx={x - 19 + v * 38}
                  cy="183"
                  rx="12"
                  ry="3"
                  fill="#b6c8d5"
                />
              </g>
            ))}
            <text
              x={x}
              y="92"
              textAnchor="middle"
              fontSize="11"
              fill="#99b0c5"
              fontFamily="sans-serif"
            >
              {i + 1}
            </text>
            <text
              data-stroke
              x={x}
              y="110"
              textAnchor="middle"
              fontSize="9"
              fill="#f38a26"
              fontFamily="sans-serif"
            >
              {strokeNames[m.stroke]}
            </text>
          </g>
        );
      })}
      <path
        d="M85 128L107 116H536L560 130V157H85Z"
        fill={fill("block")}
        stroke="#bdd0de"
      />
      <rect
        x="87"
        y="118"
        width="469"
        height="23"
        rx="6"
        fill={fill("dark")}
        stroke="#73899b"
      />
      <path d="M115 128H502" stroke="#d77527" strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle
          key={i}
          cx={104 + i * 70}
          cy="135"
          r="3"
          fill="#dce5eb"
          stroke="#30485b"
        />
      ))}
      <path d="M91 360H550" stroke="#becdd8" strokeWidth="9" opacity=".55" />
      <circle
        cx="614"
        cy="360"
        r="62"
        fill={fill("wheel")}
        stroke="#b2c3d0"
        strokeWidth="3"
      />
      <g data-flywheel>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 45} 614 360)`}>
            <ellipse
              cx="614"
              cy="317"
              rx="8"
              ry="10"
              fill="#0c2032"
              stroke="#93a8b9"
            />
            <path d="M610 300h8" stroke="#d2dee6" strokeWidth="3" />
          </g>
        ))}
        <circle
          cx="614"
          cy="360"
          r="18"
          fill="#d97829"
          stroke="#f2bb85"
          strokeWidth="2"
        />
      </g>
      <circle
        cx="595"
        cy="149"
        r="27"
        fill={fill("wheel")}
        stroke="#a7bdce"
        strokeWidth="2"
      />
      <g data-cam>
        <ellipse cx="595" cy="133" rx="6" ry="9" fill="#f08a36" />
        <path d="M595 149V172" stroke="#c3d3df" strokeWidth="4" />
      </g>
      <path
        d="M568 152C640 169 663 280 650 308"
        fill="none"
        stroke="#869cac"
        strokeWidth="6"
        strokeDasharray="5 3"
      />
      <text x="105" y="442" fontSize="9" fill="#142d42" fontFamily="sans-serif">
        4 CILINDROS · ORDEM 1–3–4–2
      </text>
    </svg>
  );
}
