import { useEffect, useState } from "react";
import {
  healthResponseSchema,
  type HealthResponse,
} from "@learning-app/shared";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const body: unknown = await response.json();
        const parsed = healthResponseSchema.parse(body);

        if (!cancelled) {
          setHealth(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Health check failed");
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <h1>C Fundamentals Learning Lab</h1>
      <p>A minimal application foundation for the C curriculum.</p>
      {health ? (
        <p>
          API status: {health.status} ({health.service})
        </p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>Checking API health…</p>
      )}
    </main>
  );
}
