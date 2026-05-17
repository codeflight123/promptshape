"use client";

import { useState } from "react";
import CadViewer from "@/components/CadViewer";
import { createFeatureStudioCode } from "@/lib/createFeatureStudioCode";
import { applyProceduralGenerators } from "@/lib/proceduralCad";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [manualJson, setManualJson] = useState("");
  const [response, setResponse] = useState("");
  const [featureScript, setFeatureScript] = useState("");
  const [onshapeUrl, setOnshapeUrl] = useState("");
  const [cadJsonObj, setCadJsonObj] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creatingOnshape, setCreatingOnshape] = useState(false);

  function cleanJsonText(text: string) {
    let cleaned = text.trim();

    cleaned = cleaned.replace(/```json/gi, "");
    cleaned = cleaned.replace(/```/g, "");
    cleaned = cleaned.trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    return cleaned;
  }

  function loadCadJson(cadJson: any) {
    const proceduralCad = applyProceduralGenerators(cadJson);

    setResponse(JSON.stringify(proceduralCad, null, 2));
    setCadJsonObj(proceduralCad);
    setFeatureScript(createFeatureStudioCode(proceduralCad));
    setOnshapeUrl("");
  }

  async function generateCAD() {
    if (!prompt.trim()) {
      setResponse("Please enter a prompt first.");
      return;
    }

    setLoading(true);
    setResponse("");
    setFeatureScript("");
    setOnshapeUrl("");
    setCadJsonObj(null);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData.error || "OpenRouter AI request failed.");
      }

      const cleaned = cleanJsonText(aiData.text);
      const cadJson = JSON.parse(cleaned);

      loadCadJson(cadJson);
    } catch (err: any) {
      console.warn("Handled AI error:", err);

      const message =
        err?.message ||
        err?.error ||
        (typeof err === "string" ? err : JSON.stringify(err, null, 2));

      setResponse(
        `AI Error: ${message}\n\nCheck that OPENROUTER_API_KEY exists in .env.local and that app/api/ai/route.ts is created.`
      );
    }

    setLoading(false);
  }

  function loadManualJson() {
    try {
      const cleaned = cleanJsonText(manualJson);
      const cadJson = JSON.parse(cleaned);
      loadCadJson(cadJson);
    } catch (err) {
      setResponse(
        `Manual JSON Error: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`
      );
    }
  }

  function loadGearPreset() {
    const gear = {
      object: "single spur gear",
      units: "inch",
      designIntent: {
        category: "single_part",
        objectType: "spur gear",
        mainPurpose: "rotational power transmission",
        outerDiameter: 3,
        thickness: 0.4,
        centerBore: 0.5,
        toothCount: 24,
      },
      parts: [
        {
          type: "cylinder",
          name: "gear_body",
          radius: 1.5,
          height: 0.4,
          orientation: { axis: "z" },
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          material: "steel",
        },
        {
          type: "hole",
          name: "center_bore",
          radius: 0.25,
          height: 0.5,
          orientation: { axis: "z" },
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        ...Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const radians = (angle * Math.PI) / 180;

          return {
            type: "box",
            name: `tooth_${i + 1}`,
            width: 0.18,
            depth: 0.34,
            height: 0.4,
            position: {
              x: Math.cos(radians) * 1.65,
              y: Math.sin(radians) * 1.65,
              z: 0,
            },
            rotation: { x: 0, y: 0, z: angle },
            material: "steel",
          };
        }),
      ],
      engineeringAnalysis: {
        materialChoice:
          "Steel is strong and wear resistant for functional gear teeth.",
        manufacturingMethod:
          "Can be CNC machined, laser cut from plate, or 3D printed as a prototype.",
        weakPoints:
          "The rectangular teeth are visual placeholders; real gears need involute tooth profiles.",
        improvements:
          "Add involute tooth curves, keyway, hub, fillets, and toleranced bore.",
      },
    };

    setManualJson(JSON.stringify(gear, null, 2));
    loadCadJson(gear);
  }

  async function createOnshapeDoc() {
    setCreatingOnshape(true);
    setOnshapeUrl("");

    try {
      if (!cadJsonObj) {
        throw new Error("No CAD JSON loaded.");
      }

      const docName = cadJsonObj?.object
        ? `PromptShape - ${cadJsonObj.object}`
        : "PromptShape Generated CAD";

      const res = await fetch("/api/onshape/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: docName,
          cad: cadJsonObj,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create Onshape document.");
      }

      setOnshapeUrl(data.url);
    } catch (err) {
      console.warn("Handled Onshape error:", err);

      setOnshapeUrl(
        `Error creating Onshape document: ${
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : JSON.stringify(err, null, 2)
        }`
      );
    }

    setCreatingOnshape(false);
  }

  async function copyFeatureScript() {
    if (!featureScript) return;
    await navigator.clipboard.writeText(featureScript);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl font-bold mb-4">PromptShape</h1>

        <p className="text-zinc-400 mb-8">
          AI CAD assistant using OpenRouter, exact CAD JSON, 3D preview,
          engineering reasoning, FeatureScript, and Onshape export.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Create a pillow block bearing support for a horizontal rotating shaft. Do not make a bracket."
          className="w-full h-40 rounded-xl bg-zinc-900 border border-zinc-700 p-4 text-white outline-none resize-none"
        />

        <div className="flex gap-4 mt-4 flex-wrap">
          <button
            onClick={generateCAD}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate CAD with OpenRouter"}
          </button>

          <button
            onClick={loadGearPreset}
            className="px-6 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition font-semibold"
          >
            Load Gear Preset
          </button>

          <button
            onClick={createOnshapeDoc}
            disabled={creatingOnshape || !cadJsonObj}
            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-semibold disabled:opacity-50"
          >
            {creatingOnshape ? "Creating..." : "Create Onshape Document"}
          </button>

          <button
            onClick={copyFeatureScript}
            disabled={!featureScript}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition font-semibold disabled:opacity-50"
          >
            Copy FeatureScript
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Manual CAD JSON</h2>

          <textarea
            value={manualJson}
            onChange={(e) => setManualJson(e.target.value)}
            placeholder="Paste CAD JSON here..."
            className="w-full h-56 rounded-xl bg-zinc-900 border border-zinc-700 p-4 text-white outline-none resize-none font-mono text-sm"
          />

          <button
            onClick={loadManualJson}
            className="mt-4 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 transition font-semibold"
          >
            Load Manual JSON
          </button>
        </div>

        {onshapeUrl && (
          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            {onshapeUrl.startsWith("http") ? (
              <a
                href={onshapeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                Open Onshape Document
              </a>
            ) : (
              <p className="text-red-400 whitespace-pre-wrap">{onshapeUrl}</p>
            )}
          </div>
        )}

        {cadJsonObj?.designIntent && (
          <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-2">
            <h2 className="text-2xl font-semibold mb-3">Design Intent</h2>

            <p>
              <b>Category:</b>{" "}
              {cadJsonObj.designIntent.category || "general"}
            </p>

            <p>
              <b>Object Type:</b>{" "}
              {cadJsonObj.designIntent.objectType || cadJsonObj.object}
            </p>

            <p>
              <b>Purpose:</b>{" "}
              {cadJsonObj.designIntent.mainPurpose || "Not specified"}
            </p>
          </div>
        )}

        {cadJsonObj && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">3D CAD Preview</h2>
            <CadViewer cad={cadJsonObj} />
          </div>
        )}

        {cadJsonObj?.engineeringAnalysis && (
          <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-3">
            <h2 className="text-2xl font-semibold mb-4">
              Engineering Analysis
            </h2>

            <p>
              <b>Material:</b>{" "}
              {cadJsonObj.engineeringAnalysis.materialChoice}
            </p>

            <p>
              <b>Manufacturing:</b>{" "}
              {cadJsonObj.engineeringAnalysis.manufacturingMethod}
            </p>

            <p>
              <b>Weak Points:</b>{" "}
              {cadJsonObj.engineeringAnalysis.weakPoints}
            </p>

            <p>
              <b>Improvements:</b>{" "}
              {cadJsonObj.engineeringAnalysis.improvements}
            </p>
          </div>
        )}

        {cadJsonObj?.features && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              Parametric Feature Tree
            </h2>

            <pre className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-cyan-400">
              {JSON.stringify(cadJsonObj.features, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">CAD JSON</h2>

          <pre className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-green-400">
            {response || "Your CAD JSON will appear here..."}
          </pre>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold">FeatureScript Output</h2>

            <button
              onClick={copyFeatureScript}
              disabled={!featureScript}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition font-semibold disabled:opacity-50"
            >
              Copy
            </button>
          </div>

          <pre className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-orange-400">
            {featureScript || "Generated FeatureScript will appear here..."}
          </pre>
        </div>
      </div>
    </main>
  );
}