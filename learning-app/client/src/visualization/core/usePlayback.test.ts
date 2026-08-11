import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAYBACK_SPEED_INTERVALS } from "./visualization-types";
import { usePlayback } from "./usePlayback";

describe("usePlayback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Play advances steps over time", () => {
    const { result } = renderHook(() => usePlayback(4));

    act(() => {
      result.current.play();
    });

    expect(result.current.playing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(PLAYBACK_SPEED_INTERVALS[1]);
    });

    expect(result.current.stepIndex).toBe(1);
  });

  it("Pause stops autoplay", () => {
    const { result } = renderHook(() => usePlayback(4));

    act(() => {
      result.current.play();
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(PLAYBACK_SPEED_INTERVALS[1] * 3);
    });

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it("stops autoplay at final step", () => {
    const { result } = renderHook(() => usePlayback(2));

    act(() => {
      result.current.play();
    });

    act(() => {
      vi.advanceTimersByTime(PLAYBACK_SPEED_INTERVALS[1] * 5);
    });

    expect(result.current.stepIndex).toBe(1);
    expect(result.current.playing).toBe(false);
  });

  it("speed influences interval", () => {
    const { result } = renderHook(() => usePlayback(5));

    act(() => {
      result.current.setSpeed(2);
      result.current.play();
    });

    act(() => {
      vi.advanceTimersByTime(PLAYBACK_SPEED_INTERVALS[2] - 1);
    });
    expect(result.current.stepIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.stepIndex).toBe(1);
  });

  it("cleans up timers on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { result, unmount } = renderHook(() => usePlayback(5));

    act(() => {
      result.current.play();
    });

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
