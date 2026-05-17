type AnyCad = any;

function box(name: string, x: number, y: number, z: number, width: number, depth: number, height: number, material = "aluminum") {
  return {
    type: "box",
    name,
    width,
    depth,
    height,
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    material,
  };
}

function cylinder(name: string, x: number, y: number, z: number, radius: number, height: number, axis: "x" | "y" | "z" = "z", material = "steel") {
  return {
    type: "cylinder",
    name,
    radius,
    height,
    orientation: { axis },
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    material,
  };
}

function enhancePillowBlock(cad: AnyCad) {
  return {
    ...cad,
    object: "Procedural Pillow Block Bearing Support",
    units: "inch",
    parts: [
      box("base_plate", 0, 0, 0.2, 6, 4, 0.4),
      box("left_support_wall", -1.8, 0, 1.3, 0.45, 1.6, 2.2),
      box("right_support_wall", 1.8, 0, 1.3, 0.45, 1.6, 2.2),
      cylinder("horizontal_bearing_housing", 0, 0, 2.35, 0.8, 3.6, "x", "aluminum"),
      cylinder("shaft_hole_marker", 0, 0, 2.35, 0.32, 3.9, "x", "black"),
      cylinder("front_left_mounting_hole_marker", -2.1, 1.25, 0.45, 0.18, 0.5, "z", "red"),
      cylinder("front_right_mounting_hole_marker", 2.1, 1.25, 0.45, 0.18, 0.5, "z", "red"),
      cylinder("rear_left_mounting_hole_marker", -2.1, -1.25, 0.45, 0.18, 0.5, "z", "red"),
      cylinder("rear_right_mounting_hole_marker", 2.1, -1.25, 0.45, 0.18, 0.5, "z", "red"),
    ],
    material: "aluminum",
    designIntent: {
      category: "bearing_support",
      objectType: "pillow block bearing support",
      mainPurpose: "support a horizontal rotating shaft",
    },
    engineeringAnalysis: {
      materialChoice: "Aluminum is lightweight and machinable.",
      manufacturingMethod: "This can be CNC milled and drilled.",
      weakPoints: "The wall-to-base joints need fillets in a real part.",
      improvements: "Add real boolean holes, fillets, and bearing seat tolerances.",
    },
  };
}

export function applyProceduralGenerators(cad: AnyCad) {
  const text = `
    ${cad.object || ""}
    ${JSON.stringify(cad.designIntent || {})}
    ${JSON.stringify(cad.engineeringAnalysis || {})}
    ${JSON.stringify(cad.parts || [])}
  `.toLowerCase();

  if (
    text.includes("pillow block") ||
    text.includes("bearing support") ||
    text.includes("shaft support") ||
    text.includes("bearing block") ||
    text.includes("bearing housing")
  ) {
    return enhancePillowBlock(cad);
  }

  return cad;
}