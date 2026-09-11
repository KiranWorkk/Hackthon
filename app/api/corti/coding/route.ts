import { NextResponse } from "next/server";
import { mintCortiToken } from "@/lib/server/corti";
import type { CodingSystem } from "@/features/charting/lib/corti/types";

const VALID_SYSTEMS = new Set<CodingSystem>([
  "icd10cm-outpatient",
  "icd10cm-inpatient",
  "icd10pcs",
  "cpt",
]);

const DEFAULT_SYSTEMS: CodingSystem[] = ["icd10cm-outpatient", "cpt"];

/**
 * Predicts medical codes (ICD-10-CM, ICD-10-PCS, CPT) for the finished chart
 * note via Corti's /v2/tools/coding/ endpoint. Mirrors app/api/corti/session/route.ts:
 * mint a short-lived token server-side (the OAuth client secret never
 * reaches the client), then call Corti and relay its response.
 */
export async function POST(request: Request) {
  let body: { text?: string; systems?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "No chart content to code yet." }, { status: 400 });
  }

  const requestedSystems = (body.systems ?? DEFAULT_SYSTEMS).filter((system): system is CodingSystem =>
    VALID_SYSTEMS.has(system as CodingSystem)
  );
  if (requestedSystems.length === 0) {
    return NextResponse.json({ error: "No valid coding systems requested." }, { status: 400 });
  }

  let tokenInfo;
  try {
    tokenInfo = await mintCortiToken();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Corti authentication failed." },
      { status: 500 }
    );
  }

  const { accessToken, tenantName, environment } = tokenInfo;
  const codingUrl = `https://api.${environment}.corti.app/v2/tools/coding/`;

  let codingRes: Response;
  try {
    codingRes = await fetch(codingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Tenant-Name": tenantName,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system: requestedSystems,
        context: [{ type: "text", text }],
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Could not reach Corti to predict codes." }, { status: 502 });
  }

  if (!codingRes.ok) {
    const detail = await codingRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Corti could not predict codes (${codingRes.status}). ${detail}`.trim() },
      { status: 502 }
    );
  }

  const data = (await codingRes.json()) as {
    codes?: unknown;
    candidates?: unknown;
  };

  return NextResponse.json({
    codes: Array.isArray(data.codes) ? data.codes : [],
    candidates: Array.isArray(data.candidates) ? data.candidates : [],
  });
}
