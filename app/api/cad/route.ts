import { NextResponse } from "next/server";

type Part = {
  type: string;
  name?: string;
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  operation?: string;
  position?: {
    x?: number;
    y?: number;
    z?: number;
  };
};

function iso(x: number, y: number, z: number) {
  const scale = 45;
  return {
    x: 350 + (x - y) * scale,
    y: 260 + (x + y) * scale * 0.45 - z * scale,
  };
}

function boxSvg(part: Part) {
  const w = part.width ?? 1;
  const d = part.depth ?? 1;
  const h = part.height ?? 1;

  const px = part.position?.x ?? 0;
  const py = part.position?.y ?? 0;
  const pz = part.position?.z ?? 0;

  const p1 = iso(px - w / 2, py - d / 2, pz - h / 2);
  const p2 = iso(px + w / 2, py - d / 2, pz - h / 2);
  const p3 = iso(px + w / 2, py + d / 2, pz - h / 2);
  const p4 = iso(px - w / 2, py + d / 2, pz - h / 2);

  const p5 = iso(px - w / 2, py - d / 2, pz + h / 2);
  const p6 = iso(px + w / 2, py - d / 2, pz + h / 2);
  const p7 = iso(px + w / 2, py + d / 2, pz + h / 2);
  const p8 = iso(px - w / 2, py + d / 2, pz + h / 2);

  return `
    <polygon points="${p5.x},${p5.y} ${p6.x},${p6.y} ${p7.x},${p7.y} ${p8.x},${p8.y}" fill="#60a5fa" stroke="#0f172a" stroke-width="2"/>
    <polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p6.x},${p6.y} ${p5.x},${p5.y}" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
    <polygon points="${p2.x},${p2.y} ${p3.x},${p3.y} ${p7.x},${p7.y} ${p6.x},${p6.y}" fill="#2563eb" stroke="#0f172a" stroke-width="2"/>
  `;
}

function cylinderSvg(part: Part) {
  const px = part.position?.x ?? 0;
  const py = part.position?.y ?? 0;
  const pz = part.position?.z ?? 0;
  const p = iso(px, py, pz);

  const isHole = part.operation === "subtract";

  return `
    <ellipse cx="${p.x}" cy="${p.y}" rx="22" ry="12" fill="${
    isHole ? "#020617" : "#f97316"
  }" stroke="#f8fafc" stroke-width="2"/>
    <text x="${p.x + 28}" y="${p.y + 4}" fill="#e5e7eb" font-size="12">
      ${part.name ?? "cylinder"}
    </text>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cad = body.cad;

    const parts: Part[] = cad.parts || [];

    const shapes = parts
      .map((part) => {
        if (part.type === "box") return boxSvg(part);
        if (part.type === "cylinder") return cylinderSvg(part);
        return "";
      })
      .join("");

    const svg = `
      <svg width="700" height="520" viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">
        <rect width="700" height="520" fill="#020617"/>
        <text x="30" y="45" fill="#ffffff" font-size="26" font-family="Arial" font-weight="bold">
          ${cad.object ?? "CAD Preview"}
        </text>
        <text x="30" y="75" fill="#94a3b8" font-size="14" font-family="Arial">
          Material: ${cad.material ?? "not specified"} | Units: ${cad.units ?? "inch"}
        </text>
        ${shapes}
      </svg>
    `;

    return NextResponse.json({ svg });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not generate CAD preview." },
      { status: 500 }
    );
  }
}