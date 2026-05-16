import { NextResponse } from "next/server";
import {
  createOnshapeDocument,
  getDefaultIds,
  addCadFeatures,
} from "@/lib/onshape";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name || "PromptShape Generated CAD";
    const cad = body.cad;

    if (!cad) {
      throw new Error("No CAD JSON was sent to Onshape route.");
    }

    const document = await createOnshapeDocument(name);
    const { did, wid, eid } = await getDefaultIds(document);

    await addCadFeatures(did, wid, eid, cad);

    return NextResponse.json({
      success: true,
      document,
      cad,
      url: `https://cad.onshape.com/documents/${did}/w/${wid}/e/${eid}`,
    });
  } catch (error: any) {
    console.warn("Onshape create error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create Onshape document.",
      },
      { status: 500 }
    );
  }
}