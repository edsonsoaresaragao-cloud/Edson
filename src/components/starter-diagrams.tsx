"use client";
import { starterSequence } from "@/lib/starter-parts";

export function StarterSchematic({
  explosion,
  phase,
  selected,
  isolate,
  onSelect,
}: {
  explosion: number;
  phase: number;
  selected: number;
  isolate: boolean;
  onSelect: (id: number) => void;
}) {
  const sequence = starterSequence(phase * 2.6 + 1.3);
  const e = Math.max(0, Math.min(1, explosion));
  const x = (base: number, target: number) => base + (target - base) * e;
  const visible = (id: number) => !isolate || selected === id;
  const props = (id: number) => ({
    onClick: () => onSelect(id),
    opacity: visible(id) ? 1 : 0,
    style: { cursor: "pointer" },
    stroke: selected === id ? "#ffd072" : "#b9cbd6",
    strokeWidth: selected === id ? 3 : 1.5,
  });
  return (
    <svg
      viewBox="0 0 920 410"
      role="img"
      aria-label="Vista esquemática interativa do arranque, com pinhão, garfo, solenoide, rotor, estator e escovas. Os botões da lista permitem selecionar cada peça."
    >
      <defs>
        <linearGradient id="starter-metal">
          <stop stopColor="#5b6c77" />
          <stop offset=".45" stopColor="#d4e2e9" />
          <stop offset="1" stopColor="#4e616d" />
        </linearGradient>
        <linearGradient id="starter-copper">
          <stop stopColor="#874c28" />
          <stop offset=".5" stopColor="#e6a266" />
          <stop offset="1" stopColor="#8b502c" />
        </linearGradient>
      </defs>
      <path d="M55 255H870" stroke="#456175" strokeDasharray="5 8" />
      <g {...props(1)} transform={`translate(${x(270, 65)} 185)`}>
        <path d="M0 45Q16 6 75 0V140Q16 134 0 95Z" fill="url(#starter-metal)" />
        <path d="M8 51L59 26V115L8 91Z" fill="#102335" />
        <ellipse cx="69" cy="70" rx="13" ry="69" fill="none" />
        <circle cx="48" cy="-4" r="12" fill="url(#starter-metal)" />
        <circle cx="48" cy="144" r="12" fill="url(#starter-metal)" />
      </g>
      <g
        {...props(2)}
        transform={`translate(${x(304, 178) - sequence.travel * 18} 255)`}
      >
        <path
          d="M-21-21L-10-28H10L21-21V21L10 28H-10L-21 21Z"
          fill="url(#starter-metal)"
        />
        <path d="M-17-15H18M-17 0H18M-17 15H18" stroke="#354650" />
      </g>
      <g
        {...props(3)}
        transform={`translate(${x(340, 255) - sequence.travel * 18} 255)`}
      >
        <rect
          x="-23"
          y="-35"
          width="46"
          height="70"
          rx="12"
          fill="url(#starter-metal)"
        />
        <ellipse cx="-21" rx="6" ry="34" fill="#425867" />
      </g>
      <g
        {...props(4)}
        transform={`translate(${x(360, 333)} 180) rotate(${-sequence.travel * 10})`}
      >
        <path
          d="M-5-15L10-15L15 18L4 78L-25 100L-33 89L-10 68L0 15Z"
          fill="#c4a15a"
        />
        <circle cy="11" r="6" fill="#0e2232" />
      </g>
      <g {...props(5)} transform={`translate(${x(430, 420)} ${x(133, 97)})`}>
        <rect
          x="-54"
          y="-25"
          width="111"
          height="50"
          rx="16"
          fill="url(#starter-metal)"
        />
        <rect x="52" y="-24" width="16" height="48" rx="5" fill="#1a2835" />
        <path d="M68-13H87M68 13H87" stroke="#d69455" strokeWidth="7" />
        <path
          d={`M-54 0H${-78 + sequence.travel * 12}`}
          stroke="#c9d8e0"
          strokeWidth="10"
        />
      </g>
      <g {...props(6)} transform={`translate(${x(470, 658)} 255)`}>
        <path
          d="M-88-63Q-76-78-67-78H70Q87-77 88-62V62Q87 77 70 78H-67Q-85 78-88 63Z"
          fill="#233443"
          fillOpacity=".8"
        />
        <ellipse cx="-87" rx="9" ry="64" fill="none" />
        <path d="M-70-62H69M-70 62H69" stroke="#8799a5" />
      </g>
      <g {...props(7)} transform={`translate(${x(466, 432)} 255)`}>
        <path d="M-110 0H112" stroke="#adbdc7" strokeWidth="10" />
        <rect
          x="-51"
          y="-43"
          width="91"
          height="86"
          rx="12"
          fill="url(#starter-metal)"
        />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M-47 ${-35 + i * 10}H35`} stroke="#384e5f" />
        ))}
        <path
          d="M-53-36Q-75-16-54 36M41-36Q62-13 43 36"
          fill="none"
          stroke="#ce8a4c"
          strokeWidth="9"
        />
        <rect
          x="62"
          y="-26"
          width="30"
          height="52"
          rx="3"
          fill="url(#starter-copper)"
        />
        {[67, 73, 79, 85].map((v) => (
          <path key={v} d={`M${v}-25V25`} stroke="#4c3524" />
        ))}
      </g>
      <g {...props(8)} transform={`translate(${x(470, 555)} 255)`}>
        <ellipse
          rx="40"
          ry="62"
          fill="none"
          stroke="#6c7f8c"
          strokeWidth="12"
        />
        {[-1, 1].map((v) => (
          <path
            key={v}
            d={`M-24 ${v * 43}Q0 ${v * 65} 24 ${v * 43}`}
            fill="none"
            stroke="#d08c4d"
            strokeWidth="13"
          />
        ))}
      </g>
      <g {...props(9)} transform={`translate(${x(555, 785)} 255)`}>
        <ellipse
          rx="19"
          ry="58"
          fill="none"
          stroke="#c7a05b"
          strokeWidth="13"
        />
        <path d="M-10-42H12M-13 40H13" stroke="#d3b778" strokeWidth="9" />
      </g>
      <g {...props(10)} transform={`translate(${x(548, 838)} 255)`}>
        <rect x="-10" y="-40" width="20" height="18" rx="3" fill="#303943" />
        <rect x="-10" y="22" width="20" height="18" rx="3" fill="#303943" />
        <path
          d="M0-40Q17-52 8-60M0 40Q18 50 9 59"
          fill="none"
          stroke="#d69552"
          strokeWidth="4"
        />
      </g>
      <g {...props(11)} transform={`translate(${x(596, 888)} 255)`}>
        <ellipse rx="14" ry="65" fill="url(#starter-metal)" />
        <ellipse rx="5" ry="12" fill="#c4a568" />
      </g>
      {!isolate && (
        <text
          x="460"
          y="380"
          textAnchor="middle"
          fill="#b6cfdf"
          stroke="none"
          fontSize="15"
        >
          Vista 2D didática · selecione as peças pela lista ou pelo desenho
        </text>
      )}
    </svg>
  );
}

export function StarterCircuit({
  contact,
  command,
}: {
  contact: boolean;
  command: boolean;
}) {
  return (
    <svg
      viewBox="0 0 700 240"
      role="img"
      aria-label={`Esquema elétrico simplificado: bateria, comando START no terminal 50, contatos do solenoide e motor de partida. Contato de potência ${contact ? "fechado" : "aberto"}.`}
    >
      <g fill="none" strokeWidth="4" strokeLinecap="round">
        <path
          d="M75 173V78H302M397 78H580V122"
          stroke={contact ? "#ff7d61" : "#a75b50"}
        />
        <path
          d="M302 78H328M372 78H397M328 78L372 78"
          stroke="#ffd379"
          opacity={contact ? 1 : 0}
        />
        {!contact && <path d="M328 78L369 48" stroke="#ffd379" />}
        <path
          d="M140 78V26H253M296 26H349V126"
          stroke={command ? "#ffc56c" : "#82715a"}
        />
        <path d={command ? "M253 26H296" : "M253 26L291 6"} stroke="#ffc56c" />
        <path d="M580 182V211H75V194" stroke="#afc7d8" />
        <rect x="304" y="45" width="92" height="108" rx="12" stroke="#6c95b2" />
        <path d="M332 126q8-24 16 0q8-24 16 0" stroke="#ffc56c" />
        <rect x="49" y="171" width="52" height="25" rx="4" stroke="#afc7d8" />
        <circle
          cx="580"
          cy="152"
          r="30"
          stroke={contact ? "#ffc56c" : "#afc7d8"}
        />
      </g>
      <g fill="#d5e7f5" fontSize="14" textAnchor="middle">
        <text x="75" y="157">
          Bateria 12 V
        </text>
        <text x="268" y="20">
          START
        </text>
        <text x="350" y="175">
          Solenoide
        </text>
        <text x="580" y="157" fontSize="20">
          M
        </text>
        <text x="580" y="232">
          Induzido + campo
        </text>
        <text x="293" y="68">
          30
        </text>
        <text x="367" y="115">
          50
        </text>
        <text x="416" y="205">
          Massa / 31
        </text>
      </g>
    </svg>
  );
}
