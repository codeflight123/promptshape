export function createParametricCADPrompt(userPrompt: string) {
  return `
You are PromptShape CAD JSON Compiler.

Return ONLY valid JSON.
No markdown.
No comments.
No trailing commas.
No explanations outside JSON.
Keep strings short.
Use inches.

SUPPORTED TYPES:
box, cylinder, wheel, airfoil, loft, cone, triangular_prism, sphere, hole, rib

CRITICAL RULES:
- Prefer simple stable primitives: boxes and cylinders.
- Do not create random duplicate plates.
- Do not create floating geometry.
- Do not create unrelated assemblies.
- If dimensions are given, preserve them.
- Always include parts.
- Always include engineeringAnalysis.
- Every part needs type, name, position, rotation, and material.
- Box parts need width, depth, height.
- Cylinder parts need radius, height, orientation.
- Wheel parts need radius, height, orientation.
- Airfoil parts need span, chord, thickness.
- Loft parts need sections.
- Positions are center points.

STRICT JSON FORMAT:
{
  "object": "requested object name",
  "units": "inch",
  "designIntent": {
    "category": "single_part | assembly | vehicle | aircraft | bracket | enclosure | robot_chassis | gearbox | bearing_support | custom",
    "objectType": "specific object type",
    "mainPurpose": "short purpose",
    "keyDimensions": {
      "length": 0,
      "width": 0,
      "height": 0,
      "diameter": 0,
      "thickness": 0
    }
  },
  "features": [],
  "parts": [],
  "material": "overall material",
  "engineeringAnalysis": {
    "materialChoice": "short sentence",
    "manufacturingMethod": "short sentence",
    "weakPoints": "short sentence",
    "improvements": "short sentence"
  }
}

PILLOW BLOCK / BEARING SUPPORT RULES:
- If the user asks for a pillow block, bearing support, shaft support, or bearing block:
  - set designIntent.category to "bearing_support"
  - set objectType to "pillow block bearing support"
  - use ONLY boxes and cylinders
  - bearing cylinder must be horizontal
  - bearing cylinder orientation axis must be x
  - shaft hole marker orientation axis must be x
  - no vertical center cylinder
  - no bracket conversion
  - no random ribs
  - no floating cylinder

RECTANGULAR ENCLOSURE RULES:
- Use ONLY boxes and cylinders.
- No loft, wedge, triangular_prism, cone, sphere, or airfoil.
- Walls sit on base.
- Lid sits slightly above walls.
- Posts connect to base.

BRACKET RULES:
- Only use bracket rules for explicit L-bracket, angle bracket, or mounting bracket.
- Do NOT treat generic support as a bracket.
- Use boxes for plates.
- Use triangular_prism only when triangular gussets are requested.

VEHICLE RULES:
- Use loft for main body.
- Use wheels for tires.
- Use airfoil for wings.
- Use cylinders for axles.
- Keep vehicle outputs simple and symmetric.

IMPORTANT:
- If unsure, output a simple base plate assembly using boxes and cylinders.
- Never output unfinished JSON.

USER REQUEST:
${userPrompt}
`;
}