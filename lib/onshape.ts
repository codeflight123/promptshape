import crypto from "crypto";

const BASE_URL = "https://cad.onshape.com";

type CadPart = any;
type CadJson = any;

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value.trim();
}

function createNonce() {
  return crypto.randomBytes(25).toString("hex");
}

function createOnshapeHeaders(method: string, path: string, query = "") {
  const accessKey = getEnv("ONSHAPE_ACCESS_KEY");
  const secretKey = getEnv("ONSHAPE_SECRET_KEY");

  const date = new Date().toUTCString();
  const nonce = createNonce();
  const contentType = "application/json";

  const hmacString =
    method.toLowerCase() +
    "\n" +
    nonce +
    "\n" +
    date.toLowerCase() +
    "\n" +
    contentType +
    "\n" +
    path.toLowerCase() +
    "\n" +
    query.toLowerCase() +
    "\n";

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(hmacString)
    .digest("base64");

  return {
    Authorization: `On ${accessKey}:HmacSHA256:${signature}`,
    Date: date,
    "On-Nonce": nonce,
    "Content-Type": contentType,
    Accept: "application/json",
  };
}

async function onshapeRequest(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: createOnshapeHeaders(method, path),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string" ? data : JSON.stringify(data, null, 2)
    );
  }

  return data;
}

function cleanName(name: string | undefined, fallback: string) {
  return (name || fallback).replace(/[^a-zA-Z0-9_ -]/g, "_");
}

export async function createOnshapeDocument(name: string) {
  return await onshapeRequest("POST", "/api/documents", {
    name,
    isPublic: true,
  });
}

export async function getDefaultIds(document: any) {
  const did = document.id;
  const wid = document.defaultWorkspace?.id;

  if (!did || !wid) {
    throw new Error("Could not find document/workspace ID.");
  }

  const elements = await onshapeRequest(
    "GET",
    `/api/documents/d/${did}/w/${wid}/elements`
  );

  const partStudio =
    elements.find((el: any) => el.elementType === "PARTSTUDIO") || elements[0];

  if (!partStudio?.id) {
    throw new Error("Could not find Part Studio element ID.");
  }

  return { did, wid, eid: partStudio.id };
}

async function addCubeFeature(
  did: string,
  wid: string,
  eid: string,
  name: string,
  size: number
) {
  const path = `/api/v9/partstudios/d/${did}/w/${wid}/e/${eid}/features`;

  return await onshapeRequest("POST", path, {
    btType: "BTFeatureDefinitionCall-1406",
    feature: {
      btType: "BTMFeature-134",
      featureType: "cube",
      name,
      parameters: [
        {
          btType: "BTMParameterQuantity-147",
          isInteger: false,
          expression: `${Math.max(0.15, size)} in`,
          parameterId: "sideLength",
        },
      ],
      returnAfterSubfeatures: false,
      suppressed: false,
    },
  });
}

function approximateSize(part: CadPart) {
  return Math.max(
    0.25,
    part.width ?? 0,
    part.depth ?? 0,
    part.height ?? 0,
    part.radius ? part.radius * 2 : 0,
    part.span ?? 0,
    part.chord ?? 0
  );
}

async function addLoftApproximation(
  did: string,
  wid: string,
  eid: string,
  part: CadPart,
  index: number
) {
  const sections = part.sections || [];

  if (!Array.isArray(sections) || sections.length === 0) {
    await addCubeFeature(did, wid, eid, `loft_placeholder_${index}`, 1);
    return;
  }

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const size = Math.max(0.2, s.width ?? 0.5, s.height ?? 0.5);

    await addCubeFeature(
      did,
      wid,
      eid,
      cleanName(`${part.name || "loft"}_section_${i + 1}`, `loft_${index}_${i}`),
      size
    );
  }
}

async function addWheelApproximation(
  did: string,
  wid: string,
  eid: string,
  part: CadPart,
  index: number
) {
  const diameter = (part.radius ?? 0.8) * 2;

  await addCubeFeature(
    did,
    wid,
    eid,
    cleanName(part.name, `wheel_${index}`),
    diameter
  );
}

async function addAirfoilApproximation(
  did: string,
  wid: string,
  eid: string,
  part: CadPart,
  index: number
) {
  const size = Math.max(0.25, part.span ?? part.width ?? 2, part.chord ?? 0.6);

  await addCubeFeature(
    did,
    wid,
    eid,
    cleanName(part.name, `airfoil_${index}`),
    size
  );
}

export async function addCadFeatures(
  did: string,
  wid: string,
  eid: string,
  cad: CadJson
) {
  const parts: CadPart[] = cad.parts || [];

  if (parts.length === 0) {
    await addCubeFeature(did, wid, eid, "Default Placeholder", 2);
    return;
  }

  let count = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.type === "hole" || part.operation === "subtract") {
      continue;
    }

    count++;

    if (part.type === "loft") {
      await addLoftApproximation(did, wid, eid, part, i);
      continue;
    }

    if (part.type === "wheel") {
      await addWheelApproximation(did, wid, eid, part, i);
      continue;
    }

    if (part.type === "airfoil") {
      await addAirfoilApproximation(did, wid, eid, part, i);
      continue;
    }

    const size = approximateSize(part);

    await addCubeFeature(
      did,
      wid,
      eid,
      cleanName(part.name, `part_${i + 1}`),
      size
    );
  }

  if (count === 0) {
    await addCubeFeature(did, wid, eid, "Fallback Placeholder", 2);
  }
}