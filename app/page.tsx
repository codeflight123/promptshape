"use client";

import { useState } from "react";
import CadViewer from "@/components/CadViewer";
import { createFeatureStudioCode } from "@/lib/createFeatureStudioCode";
import { createParametricCADPrompt } from "@/lib/createParametricCADPrompt";
import { applyProceduralGenerators } from "@/lib/proceduralGenerators";

declare global {
  interface Window {
    puter: any;
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [featureScript, setFeatureScript] = useState("");
  const [onshapeUrl, setOnshapeUrl] = useState("");
  const [cadJsonObj, setCadJsonObj] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creatingOnshape, setCreatingOnshape] = useState(false);

  function cleanJsonText(text: string) {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
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
      if (!window.puter || !window.puter.ai) {
        setResponse(
          "Puter AI is still loading. Refresh, wait 3 seconds, then try again."
        );
        setLoading(false);
        return;
      }

      const result = await window.puter.ai.chat(
        createParametricCADPrompt(prompt),
        {
          model: "gpt-4.1-mini",
        }
      );

      const content = result?.message?.content;

      let text = "";

      if (Array.isArray(content)) {
        text = content
          .map((item: any) => item.text || JSON.stringify(item))
          .join("\n");
      } else if (typeof content === "string") {
        text = content;
      } else if (typeof result === "string") {
        text = result;
      } else {
        text = JSON.stringify(result, null, 2);
      }

      const cleaned = cleanJsonText(text);

      const rawCadJson = JSON.parse(cleaned);

      const enhancedCadJson = applyProceduralGenerators(rawCadJson);

      setResponse(JSON.stringify(enhancedCadJson, null, 2));

      setCadJsonObj(enhancedCadJson);

      setFeatureScript(createFeatureStudioCode(enhancedCadJson));
    } catch (err) {
      console.warn("Handled error:", err);

      setResponse(
        `Error: ${
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : JSON.stringify(err, null, 2)
        }`
      );
    }

    setLoading(false);
  }

  async function createOnshapeDoc() {
    setCreatingOnshape(true);

    setOnshapeUrl("");

    try {
      const cadJson = response
        ? JSON.parse(cleanJsonText(response))
        : null;

      const docName = cadJson?.object
        ? `PromptShape - ${cadJson.object}`
        : "PromptShape Generated CAD";

      const res = await fetch("/api/onshape/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: docName,
          cad: cadJson,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to create Onshape document."
        );
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
        <h1 className="text-5xl font-bold mb-4">
          PromptShape
        </h1>

        <p className="text-zinc-400 mb-8">
          AI CAD assistant using design intent, procedural generators,
          3D preview, engineering reasoning, and FeatureScript.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a mechanical design, vehicle, robot chassis, enclosure, gearbox, bracket, aerodynamic body, or engineered system..."
          className="w-full h-40 rounded-xl bg-zinc-900 border border-zinc-700 p-4 text-white outline-none resize-none"
        />

        <div className="flex gap-4 mt-4 flex-wrap">
          <button
            onClick={generateCAD}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate CAD"}
          </button>

          <button
            onClick={createOnshapeDoc}
            disabled={
              creatingOnshape ||
              !response ||
              response.startsWith("Error")
            }
            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-semibold disabled:opacity-50"
          >
            {creatingOnshape
              ? "Creating..."
              : "Create Onshape Document"}
          </button>

          <button
            onClick={copyFeatureScript}
            disabled={!featureScript}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition font-semibold disabled:opacity-50"
          >
            Copy FeatureScript
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
              <p className="text-red-400 whitespace-pre-wrap">
                {onshapeUrl}
              </p>
            )}
          </div>
        )}

        {cadJsonObj?.designIntent && (
          <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-2">
            <h2 className="text-2xl font-semibold mb-3">
              Design Intent
            </h2>

            <p>
              <b>Category:</b>{" "}
              {cadJsonObj.designIntent.category || "general"}
            </p>

            <p>
              <b>Style:</b>{" "}
              {cadJsonObj.designIntent.style ||
                cadJsonObj.designIntent.objectType}
            </p>

            <p>
              <b>Wheelbase:</b>{" "}
              {cadJsonObj.designIntent.wheelbase ?? "n/a"} in
            </p>

            <p>
              <b>Track Width:</b>{" "}
              {cadJsonObj.designIntent.trackWidth ?? "n/a"} in
            </p>

            <p>
              <b>Ride Height:</b>{" "}
              {cadJsonObj.designIntent.rideHeight ?? "n/a"} in
            </p>

            <p>
              <b>CG Goal:</b>{" "}
              {cadJsonObj.designIntent.centerOfGravityGoal}
            </p>

            <p>
              <b>Aero Goal:</b>{" "}
              {cadJsonObj.designIntent.aeroGoal}
            </p>
          </div>
        )}

        {cadJsonObj && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              3D CAD Preview
            </h2>

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
          <h2 className="text-2xl font-semibold mb-4">
            CAD JSON
          </h2>

          <pre className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-green-400">
            {response || "Your CAD JSON will appear here..."}
          </pre>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold">
              FeatureScript Output
            </h2>

            <button
              onClick={copyFeatureScript}
              disabled={!featureScript}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition font-semibold disabled:opacity-50"
            >
              Copy
            </button>
          </div>

          <pre className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-orange-400">
            {featureScript ||
              "Generated FeatureScript will appear here..."}
          </pre>
        </div>
      </div>
    </main>
  );
}