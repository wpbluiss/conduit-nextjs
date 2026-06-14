import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  cachedText?: string;
  cachedAt?: string;
}

const SUPPORTED_MIME_TYPES = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
];

const MAX_TEXT_PER_FILE = 5000;

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  );
}

export function getGoogleDriveRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/google-drive/callback`;
}

export function getGoogleDriveOAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_DRIVE_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleDriveRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleDriveCode(
  code: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      redirect_uri: getGoogleDriveRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }>;
}

async function refreshGoogleDriveToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Google Drive token refresh failed");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getGoogleDriveToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "google_drive")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

async function ensureFreshDriveToken(
  supabase: SupabaseClient,
  token: ConnectorToken,
): Promise<string> {
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime();
    if (expiresAt > Date.now() + 60_000) return token.access_token;
  }
  if (!token.refresh_token) return token.access_token;
  try {
    const refreshed = await refreshGoogleDriveToken(token.refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase
      .from("conduit_connector_tokens")
      .update({
        access_token: refreshed.access_token,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", token.id);
    return refreshed.access_token;
  } catch {
    return token.access_token;
  }
}

export async function searchGoogleDriveFiles(
  supabase: SupabaseClient,
  token: ConnectorToken,
  query: string,
): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const accessToken = await ensureFreshDriveToken(supabase, token);
  const mimeQuery = SUPPORTED_MIME_TYPES.map((m) => `mimeType = '${m}'`).join(" or ");
  const q = query.trim()
    ? `(${mimeQuery}) and name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    : `(${mimeQuery}) and trashed = false`;
  const params = new URLSearchParams({
    q,
    pageSize: "20",
    fields: "files(id,name,mimeType)",
    orderBy: "modifiedTime desc",
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> };
  return json.files ?? [];
}

async function exportFileAsText(accessToken: string, file: { id: string; mimeType: string }): Promise<string> {
  const isSheet = file.mimeType === "application/vnd.google-apps.spreadsheet";
  const exportMime = isSheet ? "text/csv" : "text/plain";
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent(exportMime)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return "";
  const text = await res.text();
  return text.slice(0, MAX_TEXT_PER_FILE);
}

export async function syncSelectedFiles(
  supabase: SupabaseClient,
  token: ConnectorToken,
  fileIds: string[],
  existingFiles: GoogleDriveFile[],
): Promise<GoogleDriveFile[]> {
  const accessToken = await ensureFreshDriveToken(supabase, token);
  const now = new Date().toISOString();
  const synced: GoogleDriveFile[] = [];

  for (const fileId of fileIds.slice(0, 5)) {
    const existing = existingFiles.find((f) => f.id === fileId);
    try {
      // Fetch file metadata to get name + mimeType.
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!metaRes.ok) {
        if (existing) synced.push(existing);
        continue;
      }
      const meta = (await metaRes.json()) as { id: string; name: string; mimeType: string };
      const cachedText = await exportFileAsText(accessToken, meta);
      synced.push({ id: meta.id, name: meta.name, mimeType: meta.mimeType, cachedText, cachedAt: now });
    } catch {
      if (existing) synced.push(existing);
    }
  }
  return synced;
}

export function getSelectedFiles(token: ConnectorToken): GoogleDriveFile[] {
  const meta = token.meta as { selected_files?: GoogleDriveFile[] } | null;
  return meta?.selected_files ?? [];
}

export function renderGoogleDriveBlock(files: GoogleDriveFile[]): string {
  const withText = files.filter((f) => f.cachedText && f.cachedText.trim());
  if (withText.length === 0) return "";
  const lines: string[] = ["GOOGLE DRIVE CONTEXT:"];
  for (const f of withText) {
    const label = f.mimeType === "application/vnd.google-apps.spreadsheet" ? `[Sheet] ${f.name}` : `[Doc] ${f.name}`;
    lines.push(`\n${label}:\n${f.cachedText!.trim()}`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}
