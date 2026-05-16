"use client";

import * as THREE from "three";

type AirfoilWingProps = {
  position?: [number, number, number];
  span?: number;
  chord?: number;
  thickness?: number;
  rotation?: [number, number, number];
  color?: string;
};

function createAirfoilShape(chord: number, thickness: number) {
  const shape = new THREE.Shape();

  const pts: THREE.Vector2[] = [];

  const steps = 32;

  for (let i = 0; i <= steps; i++) {
    const x = i / steps;

    const yt =
      5 *
      thickness *
      (0.2969 * Math.sqrt(x) -
        0.126 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1015 * x * x * x * x);

    pts.push(new THREE.Vector2(x * chord, yt * chord));
  }

  for (let i = steps; i >= 0; i--) {
    const x = i / steps;

    const yt =
      5 *
      thickness *
      (0.2969 * Math.sqrt(x) -
        0.126 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1015 * x * x * x * x);

    pts.push(new THREE.Vector2(x * chord, -yt * chord));
  }

  shape.moveTo(pts[0].x, pts[0].y);

  pts.forEach((p) => shape.lineTo(p.x, p.y));

  return shape;
}

export default function AirfoilWing({
  position = [0, 0, 0],
  span = 5,
  chord = 1.2,
  thickness = 0.12,
  rotation = [0, 0, 0],
  color = "#1e293b",
}: AirfoilWingProps) {
  const shape = createAirfoilShape(chord, thickness);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: span,
    bevelEnabled: false,
    steps: 1,
  });

  geometry.center();

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.15}
      />
    </mesh>
  );
}