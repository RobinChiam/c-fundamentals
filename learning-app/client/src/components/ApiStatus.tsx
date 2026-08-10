import { useEffect, useState } from "react";
import {
  healthResponseSchema,
  type HealthResponse,
} from "@learning-app/shared";

type ApiStatusState =
  | { kind: "loading" }
  | { kind: "ok"; health: HealthResponse }
  | { kind: "error" };

export function ApiStatus() {
  const [state, setState] = useState<ApiStatusState>({ kind: "loading" });

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
          setState({ kind: "ok", health: parsed });
        }
      } catch {
        if (!cancelled) {
          setState({ kind: "error" });
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <span className="text-xs text-slate-500" aria-live="polite">
        API: checking…
      </span>
    );
  }

  if (state.kind === "error") {
    return (
      <span className="text-xs text-amber-700" role="status">
        API: unavailable
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-500" role="status">
      API: {state.health.status} ({state.health.service})
    </span>
  );
}
