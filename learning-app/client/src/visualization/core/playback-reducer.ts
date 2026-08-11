import type { PlaybackAction, PlaybackState } from "./visualization-types";

export const initialPlaybackState: PlaybackState = {
  stepIndex: 0,
  playing: false,
  speed: 1,
};

export function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "RESET":
      return { ...state, stepIndex: 0, playing: false };
    case "PREVIOUS":
      return {
        ...state,
        stepIndex: Math.max(0, state.stepIndex - 1),
        playing: false,
      };
    case "NEXT":
      return {
        ...state,
        stepIndex: Math.min(action.maxIndex, state.stepIndex + 1),
        playing: state.stepIndex >= action.maxIndex ? false : state.playing,
      };
    case "PLAY":
      return { ...state, playing: true };
    case "PAUSE":
      return { ...state, playing: false };
    case "END":
      return {
        ...state,
        stepIndex: action.maxIndex,
        playing: false,
      };
    case "TICK":
      if (state.stepIndex >= action.maxIndex) {
        return { ...state, playing: false };
      }
      return {
        ...state,
        stepIndex: state.stepIndex + 1,
        playing: state.stepIndex + 1 >= action.maxIndex ? false : state.playing,
      };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "SET_STEP_COUNT":
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex, action.maxIndex),
        playing: state.stepIndex >= action.maxIndex ? false : state.playing,
      };
    default:
      return state;
  }
}
