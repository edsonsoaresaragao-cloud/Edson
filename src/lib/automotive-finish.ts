import * as T from "three";

function castsSolidShadow(material: T.Material) {
  return (
    !(material instanceof T.MeshStandardMaterial) ||
    (!material.transparent &&
      !(material.emissive.getHex() !== 0 && material.emissiveIntensity >= 0.75))
  );
}

/** Mantém sombras nas mangueiras reconstruídas durante a explosão, sem sombrear partículas. */
export function automotiveMesh<
  G extends T.BufferGeometry,
  M extends T.Material | T.Material[],
>(geometry: G, material: M) {
  const mesh = new T.Mesh(geometry, material);
  const list = Array.isArray(material) ? material : [material];
  mesh.castShadow =
    !(
      geometry instanceof T.SphereGeometry && geometry.parameters.radius < 0.05
    ) && list.every(castsSolidShadow);
  mesh.receiveShadow = true;
  return mesh;
}

/** Mais amostras em superfícies curvas; preserva hexágonos, aberturas e setores de corte. */
export function precisionCylinder(
  ...args: ConstructorParameters<typeof T.CylinderGeometry>
) {
  const segments = args[3] ?? 32;
  args[3] = segments >= 10 ? Math.max(64, segments) : segments;
  return new T.CylinderGeometry(...args);
}
export function precisionTorus(
  ...args: ConstructorParameters<typeof T.TorusGeometry>
) {
  args[2] = Math.max(16, args[2] ?? 12);
  args[3] = Math.max(80, args[3] ?? 48);
  return new T.TorusGeometry(...args);
}
export function precisionTube(
  ...args: ConstructorParameters<typeof T.TubeGeometry>
) {
  args[1] = Math.max(64, args[1] ?? 64);
  args[3] = Math.max((args[2] ?? 1) > 0.025 ? 20 : 10, args[3] ?? 8);
  return new T.TubeGeometry(...args);
}

type Surface = "cast" | "machined" | "copper" | "rubber" | "polymer";
/** Textura procedural local: microgrão e marcas de usinagem, sem baixar imagens/HDRs. */
function surfaceTexture(surface: Surface) {
  const size = 128,
    pixels = new Uint8Array(size * size * 4);
  let seed = 12691;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = (seed >>> 24) / 255;
      const brushed = (Math.sin(y * 1.6) + Math.sin(y * 0.31)) * 0.5;
      const value =
        surface === "machined" || surface === "copper"
          ? 222 + brushed * 15 + noise * 12
          : surface === "cast"
            ? 190 + noise * 62
            : 220 + noise * 34;
      const at = (y * size + x) * 4;
      pixels[at] = pixels[at + 1] = pixels[at + 2] = Math.round(value);
      pixels[at + 3] = 255;
    }
  const texture = new T.DataTexture(pixels, size, size, T.RGBAFormat);
  texture.name = `automotive-${surface}-microfinish`;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(
    surface === "machined" ? 3 : 5,
    surface === "machined" ? 3 : 5,
  );
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
function surfaceFor(
  material: T.MeshStandardMaterial,
  partName: string,
): Surface {
  const hex = material.color.getHex(),
    r = (hex >>> 16) & 255,
    g = (hex >>> 8) & 255,
    b = hex & 255;
  if (material.metalness >= 0.6) {
    if (r > g * 1.12 && g > b * 1.12) return "copper";
    if (
      /carcaça|bloco|cabeçote|pinça|bandeja|subchassi|corpo de|caixa|coletor/i.test(
        partName,
      )
    )
      return "cast";
    return material.roughness > 0.3 ? "cast" : "machined";
  }
  return Math.max(r, g, b) < 90 ? "rubber" : "polymer";
}
/** Refina materiais existentes sem trocar referências usadas por seleção, cortes e animações. */
export function applyAutomotiveFinish(group: T.Object3D) {
  const textures = new Map<Surface, T.DataTexture>();
  const seen = new Set<T.Material>();
  let meshCount = 0;
  group.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    meshCount++;
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];
    object.castShadow =
      !(
        object.geometry instanceof T.SphereGeometry &&
        object.geometry.parameters.radius < 0.05
      ) && list.every(castsSolidShadow);
    object.receiveShadow = true;
    for (const material of list) {
      if (
        !(material instanceof T.MeshStandardMaterial) ||
        seen.has(material) ||
        material.userData.automotiveSurface
      )
        continue;
      seen.add(material);
      if (material.emissiveIntensity > 0.75 && material.emissive.getHex() !== 0)
        continue;
      let part: T.Object3D | null = object;
      while (part && !part.userData.partName) part = part.parent;
      const surface = surfaceFor(material, part?.userData.partName || "");
      material.name ||= `Acabamento ${surface}`;
      material.userData.automotiveSurface = surface;
      const texture = textures.get(surface) || surfaceTexture(surface);
      textures.set(surface, texture);
      material.roughnessMap = texture;
      material.bumpMap = texture;
      material.bumpScale =
        surface === "cast" ? 0.0018 : surface === "rubber" ? 0.0008 : 0.0004;
      if (surface === "rubber") {
        material.metalness = 0.02;
        material.roughness = 0.76;
      } else if (surface === "polymer") {
        material.metalness = 0.04;
        material.roughness = 0.46;
      } else if (surface === "copper") {
        material.metalness = 0.98;
        material.roughness = 0.24;
      } else {
        material.metalness = surface === "cast" ? 0.88 : 0.97;
        material.roughness = surface === "cast" ? 0.4 : 0.24;
      }
      material.envMapIntensity = surface === "rubber" ? 0.5 : 1;
      if (material instanceof T.MeshPhysicalMaterial) {
        material.clearcoat =
          surface === "copper" ? 0.22 : surface === "polymer" ? 0.12 : 0;
        material.clearcoatRoughness = 0.3;
        material.specularIntensity = surface === "rubber" ? 0.35 : 1;
        material.anisotropy = surface === "machined" ? 0.2 : 0;
      }
      material.needsUpdate = true;
    }
  });
  group.userData.automotiveFinish = { version: 1, meshes: meshCount };
  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      textures.forEach((texture) => texture.dispose());
    },
  };
}
