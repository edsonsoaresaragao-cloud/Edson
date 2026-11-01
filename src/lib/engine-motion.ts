const TAU = Math.PI * 2;
// Four-stroke firing order 1–3–4–2; throws 1/4 and 2/3 move in pairs.
const phases = [0, Math.PI, Math.PI * 3, Math.PI * 2];
export function engineMotion(angle: number, cylinder: number) {
  const phase =
    (((angle + phases[cylinder]) % (TAU * 2)) + TAU * 2) % (TAU * 2);
  const radius = 26,
    rodLength = 100,
    centerY = 360;
  const centerX = 125 + cylinder * 112;
  const pinX = centerX + radius * Math.sin(phase);
  const pinY = centerY - radius * Math.cos(phase);
  const wristY = pinY - Math.sqrt(rodLength ** 2 - (pinX - centerX) ** 2);
  const stroke = Math.floor(phase / Math.PI);
  return {
    centerX,
    pinX,
    pinY,
    wristY,
    stroke,
    progress: (phase % Math.PI) / Math.PI,
  };
}
export const strokeNames = [
  "Combustão / expansão",
  "Escape",
  "Admissão",
  "Compressão",
];
