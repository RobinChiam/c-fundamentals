import { describe, expect, it } from "vitest";
import { initialPlaybackState, playbackReducer } from "./playback-reducer";

describe("playbackReducer", () => {
  it("starts at initial step", () => {
    expect(initialPlaybackState.stepIndex).toBe(0);
    expect(initialPlaybackState.playing).toBe(false);
  });

  it("Next advances one step", () => {
    const next = playbackReducer(initialPlaybackState, {
      type: "NEXT",
      maxIndex: 5,
    });
    expect(next.stepIndex).toBe(1);
  });

  it("Previous moves back one step", () => {
    const state = { ...initialPlaybackState, stepIndex: 2 };
    const previous = playbackReducer(state, { type: "PREVIOUS" });
    expect(previous.stepIndex).toBe(1);
  });

  it("Previous at start remains safe", () => {
    const previous = playbackReducer(initialPlaybackState, { type: "PREVIOUS" });
    expect(previous.stepIndex).toBe(0);
  });

  it("Next at end remains safe", () => {
    const state = { ...initialPlaybackState, stepIndex: 5 };
    const next = playbackReducer(state, { type: "NEXT", maxIndex: 5 });
    expect(next.stepIndex).toBe(5);
    expect(next.playing).toBe(false);
  });

  it("Reset returns to first step", () => {
    const state = { ...initialPlaybackState, stepIndex: 4, playing: true };
    const reset = playbackReducer(state, { type: "RESET" });
    expect(reset.stepIndex).toBe(0);
    expect(reset.playing).toBe(false);
  });

  it("Play starts playback", () => {
    const playing = playbackReducer(initialPlaybackState, { type: "PLAY" });
    expect(playing.playing).toBe(true);
  });

  it("Pause stops playback", () => {
    const state = { ...initialPlaybackState, playing: true };
    const paused = playbackReducer(state, { type: "PAUSE" });
    expect(paused.playing).toBe(false);
  });

  it("Tick advances during play and stops at final step", () => {
    const state = { ...initialPlaybackState, stepIndex: 4, playing: true };
    const tick = playbackReducer(state, { type: "TICK", maxIndex: 4 });
    expect(tick.stepIndex).toBe(4);
    expect(tick.playing).toBe(false);
  });

  it("supports speed changes", () => {
    const updated = playbackReducer(initialPlaybackState, {
      type: "SET_SPEED",
      speed: 2,
    });
    expect(updated.speed).toBe(2);
  });

  it("clamps step index when step count shrinks", () => {
    const state = { ...initialPlaybackState, stepIndex: 8 };
    const updated = playbackReducer(state, { type: "SET_STEP_COUNT", maxIndex: 3 });
    expect(updated.stepIndex).toBe(3);
  });

  it("End jumps to final step and pauses", () => {
    const state = { ...initialPlaybackState, playing: true };
    const ended = playbackReducer(state, { type: "END", maxIndex: 7 });
    expect(ended.stepIndex).toBe(7);
    expect(ended.playing).toBe(false);
  });
});
