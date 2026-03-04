import { getAccessToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function streamRequest(
  path: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export type CandidateResult = {
  type: 'candidate';
  applicationId: number;
  matchPercent: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
};

export type BestResult = {
  type: 'best';
  applicationId: number;
  reason: string;
};

export type CompareStreamItem = CandidateResult | BestResult;

async function streamNdjson(
  path: string,
  body: Record<string, unknown>,
  onResult: (item: CompareStreamItem) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onResult(JSON.parse(trimmed) as CompareStreamItem);
      } catch {
        // skip malformed lines
      }
    }
  }

  // flush remaining
  if (buffer.trim()) {
    try {
      onResult(JSON.parse(buffer.trim()) as CompareStreamItem);
    } catch {
      // ignore
    }
  }
}

export const aiService = {
  generateEmailTemplate(
    name: string,
    subject: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return streamRequest('/api/ai/email-template', { name, subject }, onChunk, signal);
  },

  compareApplications(
    applicationIds: number[],
    onResult: (item: CompareStreamItem) => void,
    signal?: AbortSignal,
    forceRefresh?: boolean,
  ): Promise<void> {
    return streamNdjson('/api/ai/compare', { applicationIds, forceRefresh }, onResult, signal);
  },
};
