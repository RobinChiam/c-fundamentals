import { useCallback, useEffect, useReducer, useRef } from "react";
import { playbackReducer, initialPlaybackState } from "./playback-reducer";
import {
  PLAYBACK_SPEED_INTERVALS,
  type PlaybackSpeed,
} from "./visualization-types";

export function usePlayback(stepCount: number) {
  const maxIndex = Math.max(0, stepCount - 1);
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_STEP_COUNT", maxIndex });
  }, [maxIndex]);

  useEffect(() => {
    clearTimer();
    if (!state.playing) {
      return;
    }

    const interval = PLAYBACK_SPEED_INTERVALS[state.speed];
    timerRef.current = setInterval(() => {
      dispatch({ type: "TICK", maxIndex });
    }, interval);

    return clearTimer;
  }, [state.playing, state.speed, maxIndex, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    dispatch({ type: "RESET" });
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    dispatch({ type: "PAUSE" });
  }, [clearTimer]);

  const previous = useCallback(() => {
    clearTimer();
    dispatch({ type: "PREVIOUS" });
  }, [clearTimer]);

  const next = useCallback(() => {
    dispatch({ type: "NEXT", maxIndex });
  }, [maxIndex]);

  const play = useCallback(() => {
    if (state.stepIndex >= maxIndex) {
      return;
    }
    dispatch({ type: "PLAY" });
  }, [state.stepIndex, maxIndex]);

  const end = useCallback(() => {
    clearTimer();
    dispatch({ type: "END", maxIndex });
  }, [clearTimer, maxIndex]);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    dispatch({ type: "SET_SPEED", speed });
  }, []);

  return {
    stepIndex: state.stepIndex,
    playing: state.playing,
    speed: state.speed,
    maxIndex,
    reset,
    previous,
    next,
    play,
    pause,
    end,
    setSpeed,
  };
}
