"use client";

import * as THREE from "three";

type Section = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
};

export default function LoftMesh({
  sections,
  color = "#94a3b8",
}: {
  sections: Section[];
  color?: string;
}) {
  if (!sections || sections.length < 2) return null;

  const smoothSections: Section[] = [];
  const samplesPerSegment = 8;

  const centerCurve = new THREE.CatmullRomCurve3(
    sections.map((s) => new THREE.Vector3(s.x, s.z, s.y))
  );

  for (let i = 0; i <= samplesPerSegment * (sections.length - 1); i++) {
    const t = i / (samplesPerSegment * (sections.length - 1));
    const p = centerCurve.getPoint(t);

    const rawIndex = t * (sections.length - 1);
    const i0 = Math.floor(rawIndex);
    const i1 = Math.min(i0 + 1, sections.length - 1);
    const localT = rawIndex - i0;

    const width =
      sections[i0].width + (sections[i1].width - sections[i0].width) * localT;
    const height =
      sections[i0].height +
      (sections[i1].height - sections[i0].height) * localT;

    smoothSections.push({
      x: p.x,
      z: p.y,
      y: p.z,
      width,
      height,
    });
  }

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  smoothSections.forEach((s) => {
    const hw = s.width / 2;
    const hh = s.height / 2;

    vertices.push(
      s.x,
      s.z + hh,
      s.y - hw,

      s.x,
      s.z + hh,
      s.y + hw,

      s.x,
      s.z - hh,
      s.y + hw,

      s.x,
      s.z - hh,
      s.y - hw
    );
  });

  for (let i = 0; i < smoothSections.length - 1; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;

    indices.push(a, b, b + 1, a, b + 1, a + 1);
    indices.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
    indices.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
    indices.push(a + 3, b + 3, b, a + 3, b, a);
  }

  indices.push(0, 1, 2, 0, 2, 3);

  const last = (smoothSections.length - 1) * 4;
  indices.push(last, last + 2, last + 1, last, last + 3, last + 2);

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}