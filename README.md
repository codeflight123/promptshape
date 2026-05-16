# PromptShape

PromptShape is an AI-powered CAD concept generator that turns natural language prompts into structured parametric CAD data, 3D previews, engineering analysis, FeatureScript, and Onshape-ready design concepts.

## What It Does

Users describe something they want to build, such as a vehicle, aircraft, robot chassis, bracket, gearbox, or enclosure. PromptShape converts the idea into:

- Structured CAD JSON
- Parametric design intent
- Procedural geometry
- Three.js 3D preview
- Engineering analysis
- FeatureScript output
- Onshape document integration

## Features

- AI prompt-to-CAD generation
- Parametric feature tree output
- Procedural generators for vehicles, aircraft, enclosures, brackets, robot chassis, and gearboxes
- Real-time 3D preview using Three.js
- Lofted body surfaces for aerodynamic designs
- Realistic wheels, airfoil wings, cylinders, boxes, cones, and structural parts
- Engineering analysis including materials, manufacturing method, weak points, and improvements
- Onshape API integration for cloud CAD document creation
- Copyable FeatureScript output

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- Drei
- Puter AI
- Onshape API
- FeatureScript

## Why I Built This

PromptShape explores how AI can assist mechanical design by turning high-level engineering intent into CAD-ready structures. Instead of only generating text, it creates a parametric intermediate representation that can be previewed, analyzed, and eventually translated into real CAD features.

## Current Capabilities

PromptShape currently works best for concept-level mechanical designs, including:

- Formula-style race cars
- Aircraft concepts
- Robot chassis
- Electronics enclosures
- Mounting brackets
- Gearbox concepts
- Aerodynamic bodies

## Limitations

This is still a prototype. The Three.js preview is more advanced than the current Onshape geometry export. Some advanced CAD features like true lofts, boolean cuts, fillets, shelling, and fully constrained sketches are still in development.

## Future Improvements

- True sketch-based CAD generation
- Better Onshape feature insertion
- Real loft and surface generation
- STL export
- Boolean holes and cuts
- Fillets and chamfers
- Stress/load estimation
- Material optimization
- More advanced procedural generators

## Environment Variables

Create a `.env.local` file:

```env
ONSHAPE_ACCESS_KEY=your_onshape_access_key
ONSHAPE_SECRET_KEY=your_onshape_secret_key