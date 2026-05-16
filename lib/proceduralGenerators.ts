type AnyCad = any;

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

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

function wheel(name: string, x: number, y: number, z: number, radius = 0.85) {
  return {
    type: "wheel",
    name,
    radius,
    height: 0.55,
    orientation: { axis: "y" },
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    material: "rubber",
  };
}

function airfoil(name: string, x: number, y: number, z: number, span: number, chord: number, thickness = 0.12) {
  return {
    type: "airfoil",
    name,
    span,
    chord,
    thickness,
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    material: "carbon fiber",
  };
}

function loft(name: string, sections: any[], material = "carbon fiber") {
  return {
    type: "loft",
    name,
    sections,
    material,
  };
}

function enhanceVehicle(cad: AnyCad) {
  const intent = cad.designIntent || {};
  const wheelbase = Number(intent.wheelbase ?? 9);
  const trackWidth = Number(intent.trackWidth ?? 6);
  const rideHeight = Number(intent.rideHeight ?? 0.3);

  const frontX = wheelbase / 2;
  const rearX = -wheelbase / 2;
  const wheelY = trackWidth / 2;
  const wheelZ = rideHeight + 0.45;

  const parts: any[] = [
    loft("smooth_main_body", [
      { x: -5.4, y: 0, z: 0.65, width: 1.1, height: 0.45 },
      { x: -3.2, y: 0, z: 0.75, width: 2.2, height: 0.85 },
      { x: -0.8, y: 0, z: 0.75, width: 2.8, height: 1.0 },
      { x: 2.1, y: 0, z: 0.55, width: 1.45, height: 0.55 },
      { x: 5.5, y: 0, z: 0.35, width: 0.35, height: 0.25 },
    ]),
    loft("nose_cone", [
      { x: 1.2, y: 0, z: 0.48, width: 1.2, height: 0.42 },
      { x: 3.2, y: 0, z: 0.38, width: 0.75, height: 0.28 },
      { x: 5.7, y: 0, z: 0.25, width: 0.25, height: 0.16 },
    ]),
    loft("left_sidepod", [
      { x: -2.6, y: 1.25, z: 0.45, width: 0.85, height: 0.45 },
      { x: -0.7, y: 1.55, z: 0.5, width: 1.0, height: 0.55 },
      { x: 1.2, y: 1.25, z: 0.38, width: 0.65, height: 0.35 },
    ]),
    loft("right_sidepod", [
      { x: -2.6, y: -1.25, z: 0.45, width: 0.85, height: 0.45 },
      { x: -0.7, y: -1.55, z: 0.5, width: 1.0, height: 0.55 },
      { x: 1.2, y: -1.25, z: 0.38, width: 0.65, height: 0.35 },
    ]),

    wheel("front_left_wheel", frontX, wheelY, wheelZ),
    wheel("front_right_wheel", frontX, -wheelY, wheelZ),
    wheel("rear_left_wheel", rearX, wheelY, wheelZ, 1.0),
    wheel("rear_right_wheel", rearX, -wheelY, wheelZ, 1.0),

    cylinder("front_axle", frontX, 0, wheelZ, 0.08, trackWidth, "y"),
    cylinder("rear_axle", rearX, 0, wheelZ, 0.08, trackWidth, "y"),

    airfoil("front_wing_main", 6.1, 0, 0.22, 6.8, 1.15),
    airfoil("front_wing_upper", 5.75, 0, 0.55, 5.8, 0.75),
    airfoil("rear_wing_main", -5.3, 0, 2.25, 5.6, 1.0),
    airfoil("rear_wing_upper", -5.65, 0, 2.65, 5.2, 0.8),

    box("rear_wing_left_endplate", -5.45, 2.9, 2.35, 0.08, 0.15, 1.1, "carbon fiber"),
    box("rear_wing_right_endplate", -5.45, -2.9, 2.35, 0.08, 0.15, 1.1, "carbon fiber"),

    cylinder("halo_front_post", 0.05, 0, 1.38, 0.055, 0.9, "z", "titanium"),
    cylinder("halo_left_bar", -0.75, 0.45, 1.6, 0.045, 1.7, "x", "titanium"),
    cylinder("halo_right_bar", -0.75, -0.45, 1.6, 0.045, 1.7, "x", "titanium"),

    box("rear_diffuser_center", -5.1, 0, 0.08, 1.8, 1.4, 0.12, "carbon fiber"),
  ];

  for (let i = -2; i <= 2; i++) {
    parts.push(box(`rear_diffuser_fin_${i + 3}`, -5.25, i * 0.32, 0.26, 1.1, 0.04, 0.35, "carbon fiber"));
  }

  return {
    ...cad,
    parts: [...parts, ...(cad.parts || [])],
    designIntent: {
      ...intent,
      category: "vehicle",
      wheelbase,
      trackWidth,
      rideHeight,
      centerOfGravityGoal: intent.centerOfGravityGoal || "low and centered",
      aeroGoal: intent.aeroGoal || "high downforce with smooth sidepod airflow",
    },
  };
}

function enhanceAircraft(cad: AnyCad) {
  const intent = cad.designIntent || {};
  const wingspan = Number(intent.wingspan ?? 10);
  const fuselageLength = Number(intent.fuselageLength ?? 10);

  const parts: any[] = [
    loft("aircraft_smooth_fuselage", [
      { x: -fuselageLength / 2, y: 0, z: 0.7, width: 0.25, height: 0.25 },
      { x: -3, y: 0, z: 0.85, width: 0.9, height: 0.85 },
      { x: 0, y: 0, z: 0.9, width: 1.15, height: 1.0 },
      { x: 3, y: 0, z: 0.8, width: 0.8, height: 0.75 },
      { x: fuselageLength / 2, y: 0, z: 0.65, width: 0.2, height: 0.2 },
    ], "aluminum"),
    airfoil("left_main_wing", 0, wingspan / 4, 0.75, wingspan / 2, 1.4, 0.1),
    airfoil("right_main_wing", 0, -wingspan / 4, 0.75, wingspan / 2, 1.4, 0.1),
    airfoil("left_tailplane", -4.2, 1.5, 1.05, 2.4, 0.7, 0.08),
    airfoil("right_tailplane", -4.2, -1.5, 1.05, 2.4, 0.7, 0.08),
    box("vertical_tail_left", -4.6, 0.45, 1.55, 0.25, 0.08, 1.4, "aluminum"),
    box("vertical_tail_right", -4.6, -0.45, 1.55, 0.25, 0.08, 1.4, "aluminum"),
    cylinder("left_engine_nacelle", -0.4, 2.4, 0.45, 0.32, 1.0, "x", "titanium"),
    cylinder("right_engine_nacelle", -0.4, -2.4, 0.45, 0.32, 1.0, "x", "titanium"),
    loft("cockpit_canopy", [
      { x: 1.0, y: 0, z: 1.15, width: 0.6, height: 0.25 },
      { x: 1.8, y: 0, z: 1.22, width: 0.75, height: 0.4 },
      { x: 2.8, y: 0, z: 1.05, width: 0.35, height: 0.18 },
    ], "glass"),
    cylinder("front_landing_gear", 2.8, 0, 0.0, 0.06, 0.75, "z", "steel"),
    wheel("front_landing_wheel", 2.8, 0, -0.38, 0.25),
    cylinder("left_landing_gear", -0.8, 1.8, 0.0, 0.06, 0.75, "z", "steel"),
    cylinder("right_landing_gear", -0.8, -1.8, 0.0, 0.06, 0.75, "z", "steel"),
    wheel("left_landing_wheel", -0.8, 1.8, -0.38, 0.3),
    wheel("right_landing_wheel", -0.8, -1.8, -0.38, 0.3),
  ];

  return {
    ...cad,
    parts: [...parts, ...(cad.parts || [])],
    designIntent: {
      ...intent,
      category: "aircraft",
      wingspan,
      fuselageLength,
      centerOfGravityGoal: "slightly ahead of aerodynamic center",
      aeroGoal: "stable lift with low drag",
    },
  };
}

function enhanceRobotChassis(cad: AnyCad) {
  const parts = [
    box("robot_base_plate", 0, 0, 0.2, 6, 4, 0.25),
    box("battery_platform", 0, 0, 0.6, 3, 2, 0.25),
    box("front_motor_mount", 2.3, 0, 0.7, 0.5, 3.5, 0.7),
    box("rear_motor_mount", -2.3, 0, 0.7, 0.5, 3.5, 0.7),
    cylinder("left_drive_shaft", 0, 2.2, 0.55, 0.12, 5.4, "x"),
    cylinder("right_drive_shaft", 0, -2.2, 0.55, 0.12, 5.4, "x"),
    wheel("front_left_wheel", 2.4, 2.4, 0.55, 0.55),
    wheel("front_right_wheel", 2.4, -2.4, 0.55, 0.55),
    wheel("rear_left_wheel", -2.4, 2.4, 0.55, 0.55),
    wheel("rear_right_wheel", -2.4, -2.4, 0.55, 0.55),
  ];

  return { ...cad, parts: [...parts, ...(cad.parts || [])], designIntent: { ...(cad.designIntent || {}), category: "robot_chassis" } };
}

function enhanceEnclosure(cad: AnyCad) {
  const parts = [
    box("enclosure_bottom", 0, 0, 0, 5, 3.5, 0.2, "plastic"),
    box("enclosure_left_wall", 0, 1.85, 0.75, 5, 0.15, 1.4, "plastic"),
    box("enclosure_right_wall", 0, -1.85, 0.75, 5, 0.15, 1.4, "plastic"),
    box("enclosure_front_wall", 2.55, 0, 0.75, 0.15, 3.5, 1.4, "plastic"),
    box("enclosure_back_wall", -2.55, 0, 0.75, 0.15, 3.5, 1.4, "plastic"),
    cylinder("screw_post_1", 1.9, 1.2, 0.55, 0.18, 0.9, "z", "plastic"),
    cylinder("screw_post_2", 1.9, -1.2, 0.55, 0.18, 0.9, "z", "plastic"),
    cylinder("screw_post_3", -1.9, 1.2, 0.55, 0.18, 0.9, "z", "plastic"),
    cylinder("screw_post_4", -1.9, -1.2, 0.55, 0.18, 0.9, "z", "plastic"),
  ];

  return { ...cad, parts: [...parts, ...(cad.parts || [])], designIntent: { ...(cad.designIntent || {}), category: "enclosure" } };
}

function enhanceBracket(cad: AnyCad) {
  const parts = [
    box("base_plate", 0, 0, 0, 5, 3, 0.3, "steel"),
    box("vertical_plate", -1.6, 0, 1.4, 0.35, 3, 2.8, "steel"),
    box("left_gusset", -0.7, 0.8, 0.8, 1.6, 0.25, 1.6, "steel"),
    box("right_gusset", -0.7, -0.8, 0.8, 1.6, 0.25, 1.6, "steel"),
    cylinder("bolt_hole_marker_1", 1.5, 0.9, 0.2, 0.18, 0.5, "z", "red"),
    cylinder("bolt_hole_marker_2", 1.5, -0.9, 0.2, 0.18, 0.5, "z", "red"),
  ];

  return { ...cad, parts: [...parts, ...(cad.parts || [])], designIntent: { ...(cad.designIntent || {}), category: "bracket" } };
}

function enhanceGearbox(cad: AnyCad) {
  const parts = [
    box("gearbox_housing", 0, 0, 0.6, 4, 2.4, 1.2, "aluminum"),
    cylinder("input_shaft", 2.4, 0, 0.65, 0.16, 2.5, "x"),
    cylinder("output_shaft", -2.4, 0, 0.65, 0.16, 2.5, "x"),
    cylinder("gear_1", 0.8, 0, 0.65, 0.65, 0.35, "x", "steel"),
    cylinder("gear_2", -0.8, 0, 0.65, 0.75, 0.35, "x", "steel"),
    cylinder("bearing_left", 1.9, 0, 0.65, 0.35, 0.3, "x", "steel"),
    cylinder("bearing_right", -1.9, 0, 0.65, 0.35, 0.3, "x", "steel"),
  ];

  return { ...cad, parts: [...parts, ...(cad.parts || [])], designIntent: { ...(cad.designIntent || {}), category: "gearbox" } };
}

export function applyProceduralGenerators(cad: AnyCad) {
  const next = clone(cad);
  const text = `${next.object || ""} ${JSON.stringify(next.designIntent || {})} ${JSON.stringify(next.engineeringAnalysis || {})}`.toLowerCase();

  if (text.includes("aircraft") || text.includes("airplane") || text.includes("plane") || text.includes("jet") || text.includes("aerospace")) {
    return enhanceAircraft(next);
  }

  if (text.includes("car") || text.includes("vehicle") || text.includes("hypercar") || text.includes("race") || text.includes("formula")) {
    return enhanceVehicle(next);
  }

  if (text.includes("robot") || text.includes("chassis")) {
    return enhanceRobotChassis(next);
  }

  if (text.includes("enclosure") || text.includes("case") || text.includes("housing")) {
    return enhanceEnclosure(next);
  }

  if (text.includes("bracket") || text.includes("support")) {
    return enhanceBracket(next);
  }

  if (text.includes("gearbox") || text.includes("transmission") || text.includes("gear")) {
    return enhanceGearbox(next);
  }

  return next;
}