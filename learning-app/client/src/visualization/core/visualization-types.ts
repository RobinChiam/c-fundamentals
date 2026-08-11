export interface VisualizationTrace<TStep, TResult> {
  algorithmId: string;
  steps: TStep[];
  result: TResult;
}

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export interface PlaybackState {
  stepIndex: number;
  playing: boolean;
  speed: PlaybackSpeed;
}

export type PlaybackAction =
  | { type: "RESET" }
  | { type: "PREVIOUS" }
  | { type: "NEXT"; maxIndex: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "END"; maxIndex: number }
  | { type: "TICK"; maxIndex: number }
  | { type: "SET_SPEED"; speed: PlaybackSpeed }
  | { type: "SET_STEP_COUNT"; maxIndex: number };

export const PLAYBACK_SPEED_INTERVALS: Record<PlaybackSpeed, number> = {
  0.5: 1200,
  1: 800,
  1.5: 533,
  2: 400,
};
