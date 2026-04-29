/**
 * Bird Nest API - Updated for Raspberry Pi backend
 */

export const BASE_URL = import.meta.env.VITE_API_URL || "http://100.73.28.49:5000";

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
    headers: { "Accept": "application/json" },
  });

  const result = await parseJsonSafely(res);

  if (!res.ok || !result?.ok) {
    throw new Error(result?.error || `GET ${path} failed`);
  }

  // Om resultatet har en 'data'-nyckel, returnera den. 
  // Annars returnera hela objektet (vilket behövs för din nya status-route).
  return result.data !== undefined ? result.data : result;
}

export async function apiPost(path, body = {}, method = "POST") {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: method, // Nu kan vi även använda 'GET' om vi vill via apiPost
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // Skicka bara body om det inte är en GET-request
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  const result = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(result?.error || `POST ${path} failed: ${res.status}`);
  }

  if (!result?.ok) {
    throw new Error(result?.error || `POST ${path} failed`);
  }

  // FIX HÄR: Returnera result.data om det finns, annars hela objektet
  return result.data !== undefined ? result.data : result;
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

export function getCameraStreamUrl() {
  return `${BASE_URL}/camera/stream`;
}