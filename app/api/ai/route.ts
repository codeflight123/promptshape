import { NextResponse } from "next/server";
import { createParametricCADPrompt } from "@/lib/createParametricCADPrompt";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in .env.local");
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PromptShape",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: createParametricCADPrompt(prompt),
          },
        ],
        temperature: 0.2,
        max_tokens: 2500
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    return NextResponse.json({
      text: data.choices?.[0]?.message?.content || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "AI route failed.",
      },
      { status: 500 }
    );
  }
}