import { NextResponse } from "next/server";
import { mintCortiToken } from "@/lib/server/corti";

/**
 * Starts a Corti ambient-scribe session: mints a short-lived access token,
 * then creates a Corti "interaction" (required to open the diarizing
 * /streams WebSocket). The client uses the returned websocketUrl + token to
 * connect directly — the OAuth client secret never leaves the server.
 */
export async function POST() {
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
  const interactionsUrl = `https://api.${environment}.corti.app/v2/interactions/`;

  let interactionRes: Response;
  try {
    interactionRes = await fetch(interactionsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Tenant-Name": tenantName,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        encounter: {
          identifier: crypto.randomUUID(),
          status: "in-progress",
          type: "consultation",
          period: { startedAt: new Date().toISOString() },
        },
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Corti to start a session." },
      { status: 502 }
    );
  }

  if (!interactionRes.ok) {
    const detail = await interactionRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Corti could not start a session (${interactionRes.status}). ${detail}`.trim() },
      { status: 502 }
    );
  }

  const data = (await interactionRes.json()) as {
    interactionId?: string;
    websocketUrl?: string;
  };

  if (!data.interactionId || !data.websocketUrl) {
    return NextResponse.json(
      { error: "Corti session response was incomplete." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    accessToken,
    tenantName,
    environment,
    interactionId: data.interactionId,
    websocketUrl: data.websocketUrl,
  });
}
