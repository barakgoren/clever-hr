import type { ApiResponse, HealthResponse } from '@repo/shared';

export default function Home() {
  const example: ApiResponse<HealthResponse> = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Monorepo App</h1>
      <p>Next.js frontend is running.</p>
      <p>
        API health check:{' '}
        <a href="http://localhost:3001/api/health">
          http://localhost:3001/api/health
        </a>
      </p>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        {JSON.stringify(example, null, 2)}
      </pre>
    </main>
  );
}
