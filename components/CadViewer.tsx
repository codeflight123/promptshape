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
  sections?: { x: number; y: number; z: number; width: number; height: number }[];
  span?: number;
  chord?: number;
  thickness?: number;
  material?: string;
};

type CadJson = {
  object?: string;
  units?: string;
  parts?: CadPart[];
};

function degreesToRadians(value: number | undefined) {
  return ((value ?? 0) * Math.PI) / 180;
}

function materialColor(part: CadPart) {
  const material = (part.material || "").toLowerCase();

  if (material.includes("steel")) return "#9ca3af";
  if (material.includes("aluminum")) return "#cbd5e1";
  if (material.includes("carbon")) return "#1f2937";
  if (material.includes("rubber")) return "#020617";
  if (material.includes("glass")) return "#93c5fd";
  if (material.includes("red")) return "#ef4444";
  if (material.includes("black")) return "#020617";

  if (part.type === "hole") return "#020617";
  if (part.type === "wheel") return "#020617";
  if (part.type === "cylinder") return "#f97316";
  if (part.type === "box") return "#2563eb";
  if (part.type === "triangular_prism") return "#38bdf8";
  if (part.type === "wedge") return "#38bdf8";
  if (part.type === "loft") return "#94a3b8";
  if (part.type === "airfoil") return "#111827";

  return "#64748b";
}

function StandardMaterial({ part }: { part: CadPart }) {
  return (
    <meshStandardMaterial
      color={materialColor(part)}
      flatShading={false}
      polygonOffset
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  );
}

function TriangularPrismMesh({ part }: { part: CadPart }) {
  const w = part.width ?? 0.25;
  const d = part.depth ?? 2;
  const h = part.height ?? 2;

  const x0 = -w / 2;
  const x1 = w / 2;
  const y0 = -d / 2;
  const y1 = d / 2;
  const z0 = -h / 2;
  const z1 = h / 2;

  const vertices = new Float32Array([
    x0, y0, z0,
    x0, y1, z0,
    x0, y0, z1,

    x1, y0, z0,
    x1, y1, z0,
    x1, y0, z1,
  ]);

  const indices = [
    0, 1, 2,
    3, 5, 4,

    0, 3, 4,
    0, 4, 1,

    0, 2, 5,
    0, 5, 3,

    1, 4, 5,
    1, 5, 2,
  ];

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
        <bufferAttribute attach="index" args={[new Uint16Array(indices), 1]} />
      </bufferGeometry>
      <StandardMaterial part={part} />
    </mesh>
  );
}

function CadPartMesh({ part }: { part: CadPart }) {
  const x = part.position?.x ?? 0;
  const y = part.position?.y ?? 0;
  const z = part.position?.z ?? 0;

  const rx = degreesToRadians(part.rotation?.x);
  const ry = degreesToRadians(part.rotation?.y);
  const rz = degreesToRadians(part.rotation?.z);

  if (part.type === "loft") {
    return <LoftMesh sections={part.sections ?? []} color={materialColor(part)} />;
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
    const radius = part.radius ?? 0.2;
    const height = part.height ?? 0.5;

    let holeRotation: [number, number, number] = [0, 0, 0];

    if (part.orientation?.axis === "x") holeRotation = [0, 0, Math.PI / 2];
    if (part.orientation?.axis === "y") holeRotation = [Math.PI / 2, 0, 0];

    return (
      <mesh position={[x, z, y]} rotation={holeRotation}>
        <cylinderGeometry args={[radius, radius, height, 64]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
    );
  }

  if (part.type === "box" || part.type === "rib") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <boxGeometry args={[part.width ?? 1, part.height ?? 1, part.depth ?? 1]} />
        <StandardMaterial part={part} />
      </mesh>
    );
  }

  if (part.type === "triangular_prism" || part.type === "wedge") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <TriangularPrismMesh part={part} />
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
        <StandardMaterial part={part} />
      </mesh>
    );
  }

  if (part.type === "sphere") {
    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <sphereGeometry args={[part.radius ?? 0.5, 32, 32]} />
        <StandardMaterial part={part} />
      </mesh>
    );
  }

  if (part.type === "cone") {
    const radius = part.radius ?? (part.width ? part.width / 2 : 0.75);
    const height = part.height ?? 1.5;

    return (
      <mesh position={[x, z, y]} rotation={[rx, ry, rz]}>
        <coneGeometry args={[radius, height, 64]} />
        <StandardMaterial part={part} />
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