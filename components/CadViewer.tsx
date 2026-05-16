"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import LoftMesh from "./LoftMesh";
import WheelMesh from "./WheelMesh";
import AirfoilWing from "./AirfoilWing";

type CadPart = {
  type: string;
  name?: string;
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  operation?: string;
  orientation?: { axis?: "x" | "y" | "z" };
  rotation?: { x?: number; y?: number; z?: number };
  position?: { x?: number; y?: number; z?: number };
  sections?: {
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
  }[];
  span?: number;
  chord?: number;
  thickness?: number;
};

type CadJson = {
  object?: string;
  units?: string;
  parts?: CadPart[];
};

function degreesToRadians(value: number | undefined) {
  return ((value ?? 0) * Math.PI) / 180;
}

function CadPartMesh({ part }: { part: CadPart }) {
  const x = part.position?.x ?? 0;
  const y = part.position?.y ?? 0;
  const z = part.position?.z ?? 0;

  const rx = degreesToRadians(part.rotation?.x);
  const ry = degreesToRadians(part.rotation?.y);
  const rz = degreesToRadians(part.rotation?.z);

  if (part.type === "loft") {
    return <LoftMesh sections={part.sections ?? []} color="#94a3b8" />;
  }

  if (part.type === "wheel") {
    return (
      <WheelMesh
        position={[x, z, y]}
        radius={part.radius ?? 0.8}
        width={part.height ?? part.depth ?? 0.5}
        axis={part.orientation?.axis ?? "y"}
      />
    );
  }

  if (part.type === "airfoil") {
    return (
      <AirfoilWing
        position={[x, z, y]}
        span={part.span ?? part.width ?? 4}
        chord={part.chord ?? part.depth ?? 1}
        thickness={part.thickness ?? 0.12}
        rotation={[rx, ry, rz]}
      />
    );
  }

  if (part.operation === "subtract" || part.type === "hole") {
    return (
      <mesh position={[x, z, y]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[part.radius ?? 0.2, part.radius ?? 0.2, part.height ?? 0.5, 32]}
        />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.45} />
      </mesh>
    );
  }

  if (part.type === "box" || part.type === "rib") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <boxGeometry args={[part.width ?? 1, part.height ?? 1, part.depth ?? 1]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
    );
  }

  if (part.type === "wedge") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <coneGeometry
          args={[
            Math.max(part.width ?? 1, part.depth ?? 1) / 2,
            part.height ?? 1,
            4,
          ]}
        />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    );
  }

  if (part.type === "cylinder") {
    const radius = part.radius ?? (part.width ? part.width / 2 : 0.5);
    const height = part.height ?? 1;

    let cylinderRotation: [number, number, number] = [rx, ry, rz];

    if (part.orientation?.axis === "x") {
      cylinderRotation = [rx, ry, Math.PI / 2 + rz];
    }

    if (part.orientation?.axis === "y") {
      cylinderRotation = [Math.PI / 2 + rx, ry, rz];
    }

    return (
      <mesh position={[x, z, y]} rotation={cylinderRotation}>
        <cylinderGeometry args={[radius, radius, height, 64]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    );
  }

  if (part.type === "sphere") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <sphereGeometry args={[part.radius ?? 0.5, 32, 32]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    );
  }

  if (part.type === "cone") {
    const radius = part.radius ?? (part.width ? part.width / 2 : 0.75);
    const height = part.height ?? 1.5;

    let coneRotation: [number, number, number] = [rx, ry, rz];

    if (part.orientation?.axis === "x") {
      coneRotation = [rx, ry, Math.PI / 2 + rz];
    }

    if (part.orientation?.axis === "y") {
      coneRotation = [Math.PI / 2 + rx, ry, rz];
    }

    return (
      <mesh position={[x, z, y]} rotation={coneRotation}>
        <coneGeometry args={[radius, height, 64]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
    );
  }

  return null;
}

export default function CadViewer({ cad }: { cad: CadJson | null }) {
  const parts = cad?.parts ?? [];

  return (
    <div className="h-[620px] w-full rounded-xl overflow-hidden border border-zinc-700 bg-black">
      <Canvas camera={{ position: [13, 7, 13], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 12, 8]} intensity={1.8} />
        <directionalLight position={[-8, 8, -8]} intensity={0.7} />

        <gridHelper args={[45, 45]} />
        <axesHelper args={[5]} />

        {parts.map((part, index) => (
          <CadPartMesh key={index} part={part} />
        ))}

        <OrbitControls />
      </Canvas>
    </div>
  );
}