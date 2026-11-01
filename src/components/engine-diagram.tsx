import { useId } from "react";
import { engineParts } from "@/lib/engines";

export function EngineDiagram({
  cylinders = 4,
  v = false,
  selected = 0,
  onSelect,
}: {
  cylinders?: number;
  v?: boolean;
  selected?: number;
  onSelect?: (index: number) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const metalId = `metal-${uid}`;
  const gridId = `grid-${uid}`;
  const width = 270,
    left = 105,
    step = width / cylinders;
  return (
    <svg
      viewBox="0 0 540 690"
      role="img"
      aria-label={`Esquema explodido ilustrativo: ${cylinders} cilindros ${v ? "em V" : "em linha"}`}
    >
      <defs>
        <linearGradient id={metalId} x2="0.9" y2="1">
          <stop stopColor="#eff4f8" />
          <stop offset=".45" stopColor="#8797a9" />
          <stop offset="1" stopColor="#34485b" />
        </linearGradient>
        <pattern
          id={gridId}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path d="M26 0H0V26" fill="none" stroke="#d9e3ed" strokeWidth=".5" />
        </pattern>
      </defs>
      <rect width="540" height="690" rx="16" fill="#f2f6fa" />
      <rect width="540" height="690" fill={`url(#${gridId})`} />
      <path d="M120 60V640M365 60V640" stroke="#a7b6c6" strokeDasharray="5 7" />
      {engineParts.map((part, index) => {
        const y = 65 + index * 88;
        return (
          <g key={part.name} opacity={selected === index ? 1 : 0.82}>
            {index === 4 ? (
              Array.from({ length: cylinders }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${left + i * step + step / 2},${y})`}
                >
                  <rect
                    x="-14"
                    y="-12"
                    width="28"
                    height="25"
                    rx="5"
                    fill={`url(#${metalId})`}
                    stroke="#354d61"
                  />
                  <ellipse
                    cy="-12"
                    rx="14"
                    ry="6"
                    fill="#e5ecf2"
                    stroke="#354d61"
                  />
                  <path d="M0 12V40" stroke="#596c80" strokeWidth="9" />
                  <circle
                    cy="43"
                    r="8"
                    fill="none"
                    stroke="#354d61"
                    strokeWidth="5"
                  />
                </g>
              ))
            ) : index === 5 ? (
              <g>
                <path
                  d={`M${left} ${y}h${width}`}
                  stroke="#34485b"
                  strokeWidth="17"
                />
                {Array.from({ length: cylinders }, (_, i) => (
                  <rect
                    key={i}
                    x={left + i * step + 12}
                    y={y - 18 + (i % 2) * 12}
                    width={step - 24}
                    height="32"
                    rx="8"
                    fill={`url(#${metalId})`}
                    stroke="#34485b"
                  />
                ))}
              </g>
            ) : (
              <g>
                <path
                  d={`M${left} ${y - 13}l30 -18h${width - 30}v${index === 3 ? 52 : 24}l-30 18H${left}Z`}
                  fill={
                    index === 2
                      ? "#f58220"
                      : index === 0 || index === 6
                        ? "#263b50"
                        : `url(#${metalId})`
                  }
                  stroke={selected === index ? "#f97316" : "#34485b"}
                  strokeWidth={selected === index ? 3 : 1.5}
                />
                {(index === 2 || index === 3) &&
                  Array.from({ length: cylinders }, (_, i) => (
                    <ellipse
                      key={i}
                      cx={left + step / 2 + i * step + 8}
                      cy={y - 12}
                      rx={Math.min(step / 2 - 4, 24)}
                      ry="11"
                      fill="#172d40"
                      stroke="#dce6f0"
                      strokeWidth="2"
                    />
                  ))}
                {index === 1 &&
                  Array.from({ length: cylinders }, (_, i) => (
                    <path
                      key={i}
                      d={`M${left + step / 2 + i * step} ${y - 24}v-14`}
                      stroke="#354d61"
                      strokeWidth="6"
                    />
                  ))}
                {v && (index === 0 || index === 1) && (
                  <path
                    d={`M${left + 10} ${y - 29}l50 -22h${width - 65}l-25 18`}
                    fill="none"
                    stroke="#61788f"
                    strokeWidth="12"
                  />
                )}
              </g>
            )}
            <path d={`M390 ${y}h36`} stroke="#8b9cad" strokeDasharray="3 3" />
            <circle
              cx="450"
              cy={y}
              r="18"
              fill={selected === index ? "#f97316" : "#123452"}
            />
            <text
              x="450"
              y={y + 6}
              textAnchor="middle"
              fill="white"
              fontFamily="Arial"
              fontSize="16"
              fontWeight="700"
            >
              {index + 1}
            </text>
            <title>{part.name}</title>
            {onSelect && (
              <rect
                x="80"
                y={y - 40}
                width="395"
                height="83"
                fill="transparent"
                onClick={() => onSelect(index)}
                aria-hidden="true"
                style={{ cursor: "pointer" }}
              />
            )}
          </g>
        );
      })}
      <text x="22" y="672" fontSize="11" fill="#586d81" fontFamily="Arial">
        ESQUEMA DIDÁTICO · GEOMETRIA SIMPLIFICADA
      </text>
    </svg>
  );
}
