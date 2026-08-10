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

  it("renders the product heading and keeps API health functional", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/health") {
        return Promise.resolve({
          ok: true,
          json: async () =>
            healthResponseSchema.parse({
              status: "ok",
              service: HEALTH_SERVICE_NAME,
            }),
        });
      }

      if (url === "/api/curriculum") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lessons: [] }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(
      screen.getByRole("link", { name: "C Fundamentals Learning Lab" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/health");
    });

    expect(
      await screen.findByText(`API: ok (${HEALTH_SERVICE_NAME})`),
    ).toBeInTheDocument();
  });
});
