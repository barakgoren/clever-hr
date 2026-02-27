const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function serverFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}
