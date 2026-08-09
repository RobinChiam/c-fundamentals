import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HEALTH_SERVICE_NAME,
  healthResponseSchema,
} from "@learning-app/shared";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders "C Fundamentals Learning Lab" and the shared health status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        healthResponseSchema.parse({
          status: "ok",
          service: HEALTH_SERVICE_NAME,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "C Fundamentals Learning Lab" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/health");
    });

    expect(
      await screen.findByText(`API status: ok (${HEALTH_SERVICE_NAME})`),
    ).toBeInTheDocument();
  });
});
