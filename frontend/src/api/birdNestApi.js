/**
 * Bird Nest API - Updated for Raspberry Pi backend
 */

const BASE_URL = import.meta.env.VITE_API_URL;

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const result = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(result?.error || `GET ${path} failed: ${res.status}`);
  }

  if (!result?.ok) {
    throw new Error(result?.error || `GET ${path} failed`);
  }

  return result.data;
}

async function apiPost(path, body = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(result?.error || `POST ${path} failed: ${res.status}`);
  }

  if (!result?.ok) {
    throw new Error(result?.error || `POST ${path} failed`);
  }

  return result.data;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getSystemStatus() {
  return apiGet("/status");
}

export async function openCurtain() {
  return apiPost("/curtain/open");
}

export async function closeCurtain() {
  return apiPost("/curtain/close");
}

export async function controlLed(on) {
  return apiPost("/led", { on });
}

export function getCameraSnapshotUrl() {
  return `${BASE_URL}/camera/snapshot?t=${Date.now()}`;
}

export async function getDiagnostics() {
  return apiGet("/status");
}
