/**
 * Bird Nest API - TypeScript version with strict typing
 */

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

interface SystemStatus {
  temperature: number;
  curtainState: 'open' | 'closed';
  birdStatus: 'active' | 'inactive';
  lastMotionAt: string;
  deviceOnline: boolean;
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  action?: string;
}

interface CurtainResponse {
  curtainState: 'open' | 'closed';
}

interface LedResponse {
  ledState: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL;

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.ok) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${BASE_URL}/status`);
  return handleApiResponse<SystemStatus>(response);
}

export async function openCurtain(): Promise<CurtainResponse> {
  const response = await fetch(`${BASE_URL}/curtain/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<CurtainResponse>(response);
}

export async function closeCurtain(): Promise<CurtainResponse> {
  const response = await fetch(`${BASE_URL}/curtain/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<CurtainResponse>(response);
}

export async function controlLed(on: boolean): Promise<LedResponse> {
  const response = await fetch(`${BASE_URL}/led`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ on }),
  });
  return handleApiResponse<LedResponse>(response);
}

export function getCameraSnapshotUrl(): string {
  return `${BASE_URL}/camera/snapshot?t=${Date.now()}`;
}
