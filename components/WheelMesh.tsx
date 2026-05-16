"use client";

import * as THREE from "three";

type WheelMeshProps = {
  position: [number, number, number];
  radius?: number;
  width?: number;
  axis?: "x" | "y" | "z";
};

export default function WheelMesh({
  position,
  radius = 0.8,
  width = 0.5,
  axis = "y",
}: WheelMeshProps) {
  let rotation: [number, number, number] = [0, 0, 0];

  if (axis === "x") {
    rotation = [0, 0, Math.PI / 2];
  }

  if (axis === "y") {
    rotation = [Math.PI / 2, 0, 0];
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Tire */}
      <mesh>
        <cylinderGeometry args={[radius, radius, width, 64]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>

      {/* Outer rim */}
      <mesh position={[0, width / 2 + 0.01, 0]}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.55, 0.06, 48]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.25} />
      </mesh>

      {/* Inner rim */}
      <mesh position={[0, width / 2 + 0.04, 0]}>
        <cylinderGeometry args={[radius * 0.32, radius * 0.32, 0.08, 48]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Hub */}
      <mesh position={[0, width / 2 + 0.09, 0]}>
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Spokes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius * 0.32,
              width / 2 + 0.14,
              Math.sin(angle) * radius * 0.32,
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[radius * 0.55, 0.035, 0.045]} />
            <meshStandardMaterial
              color="#e5e7eb"
              metalness={0.5}
              roughness={0.25}
            />
          </mesh>
        );
      })}

      {/* Back rim */}
      <mesh position={[0, -width / 2 - 0.01, 0]}>
        <cylinderGeometry args={[radius * 0.48, radius * 0.48, 0.05, 48]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}