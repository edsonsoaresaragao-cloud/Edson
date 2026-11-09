import * as T from "three";

/** Annular helical gear: continuous tooth flanks and a real axial bore. */
export function helicalGearGeometry(
  teeth: number,
  module: number,
  width: number,
  bore: number,
  helixAngle = 0.32,
) {
  const samples = 10;
  const count = teeth * samples;
  const pitch = (teeth * module) / 2;
  const root = pitch - module * 1.15;
  const tip = pitch + module;
  const bevel = Math.min(0.009, width / 8, Math.max(0, (root - bore) / 3));
  const levels = [-width / 2, -width / 2 + bevel, width / 2 - bevel, width / 2];
  const positions: number[] = [],
    indices: number[] = [],
    uv: number[] = [];
  const base = pitch * Math.cos((20 * Math.PI) / 180);
  const involute = (radius: number) => {
    const angle = Math.acos(Math.min(1, base / radius));
    return Math.tan(angle) - angle;
  };
  const pitchHalf = Math.PI / (2 * teeth);
  const halfAt = (radius: number) =>
    pitchHalf + involute(pitch) - involute(Math.max(base, radius));
  const period = (Math.PI * 2) / teeth;
  const flankStart = Math.max(root, base);
  const baseHalf = halfAt(flankStart);
  const profile = [
    [-period / 2, root],
    [-baseHalf - period * 0.035, root],
    [-baseHalf, flankStart],
    [-halfAt(pitch), pitch],
    [-halfAt(tip), tip],
    [halfAt(tip), tip],
    [halfAt(pitch), pitch],
    [baseHalf, flankStart],
    [baseHalf + period * 0.035, root],
    [period / 2, root],
  ];
  for (let layer = 0; layer < levels.length; layer++) {
    const x = levels[layer];
    const twist = (Math.tan(helixAngle) * x) / pitch;
    for (let inner = 0; inner < 2; inner++)
      for (let i = 0; i < count; i++) {
        const sample = i % samples;
        const angle =
          (Math.floor(i / samples) + 0.5) * period + profile[sample][0] + twist;
        const radius = inner
          ? bore
          : profile[sample][1] - (layer === 0 || layer === 3 ? bevel : 0);
        positions.push(x, Math.cos(angle) * radius, Math.sin(angle) * radius);
        uv.push(i / count, layer / 3);
      }
  }
  const stride = count * 2;
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = layer * stride + i,
        b = layer * stride + j;
      const c = a + stride,
        d = b + stride;
      indices.push(a, b, c, b, d, c);
      indices.push(
        a + count,
        c + count,
        b + count,
        b + count,
        c + count,
        d + count,
      );
    }
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    indices.push(i, i + count, j, i + count, j + count, j);
    const last = 3 * stride;
    indices.push(
      last + i,
      last + j,
      last + i + count,
      last + i + count,
      last + j,
      last + j + count,
    );
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData = {
    teeth,
    module,
    pitchRadius: pitch,
    helical: helixAngle !== 0,
  };
  return geometry;
}

export function transmissionSleeveGeometry() {
  const shape = new T.Shape();
  shape.absarc(0, 0, 0.395, 0, Math.PI * 2, false);
  const hole = new T.Path();
  for (let i = 0; i <= 96; i++) {
    const angle = (i * Math.PI * 2) / 96;
    const radius = i % 4 === 1 || i % 4 === 2 ? 0.277 : 0.305;
    if (!i) hole.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else hole.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  shape.holes.push(hole);
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 48,
  });
  geometry.translate(0, 0, -0.13);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

export function transmissionForkGeometry() {
  const shape = new T.Shape();
  shape.absarc(0, 0, 0.46, -Math.PI * 0.12, Math.PI * 1.12, false);
  shape.lineTo(
    Math.cos(Math.PI * 1.12) * 0.375,
    Math.sin(Math.PI * 1.12) * 0.375,
  );
  shape.absarc(0, 0, 0.375, Math.PI * 1.12, -Math.PI * 0.12, true);
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.01,
    bevelSegments: 3,
    curveSegments: 40,
  });
  geometry.translate(0, 0, -0.035);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}
