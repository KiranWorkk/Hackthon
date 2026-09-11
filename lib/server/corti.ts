export interface CortiTokenInfo {
  accessToken: string;
  tenantName: string;
  environment: string;
}

/** Exchanges the server-side OAuth client credentials for a short-lived (~300s) Corti access token. */
export async function mintCortiToken(): Promise<CortiTokenInfo> {
  const { CORTI_CLIENT_ID, CORTI_CLIENT_SECRET, CORTI_TENANT_NAME, CORTI_ENVIRONMENT } =
    process.env;

  if (!CORTI_CLIENT_ID || !CORTI_CLIENT_SECRET || !CORTI_TENANT_NAME || !CORTI_ENVIRONMENT) {
    throw new Error("Corti credentials are not configured on the server.");
  }

  const tokenUrl = `https://auth.${CORTI_ENVIRONMENT}.corti.app/realms/${CORTI_TENANT_NAME}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    client_id: CORTI_CLIENT_ID,
    client_secret: CORTI_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "openid",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Corti authentication failed (${res.status}).`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Corti auth response did not include an access token.");
  }

  return { accessToken: data.access_token, tenantName: CORTI_TENANT_NAME, environment: CORTI_ENVIRONMENT };
}
