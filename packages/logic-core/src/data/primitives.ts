export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Edge {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/**
 * Major rules are frequently referenced in grids to provide additional UI.
 */
export enum MajorRule {
  MusicGrid = 'music',
  CompletePattern = 'complete_pattern',
  Underclued = 'underclued',
  WrapAround = 'wrap_around',
}

/**
 * General puzzle types for categorization. One puzzle can have multiple types.
 */
export enum PuzzleType {
  Logic = 'logic',
  Underclued = 'underclued',
  Pattern = 'pattern',
  Music = 'music',
}

export enum State {
  /**
   * Describes the violation of a rule.
   */
  Error = 'error',
  /**
   * Describes that a rule is satisfied and complete in the current grid.
   */
  Satisfied = 'satisfied',
  /**
   * Describes that a rule is not violated, but is not yet complete in the current grid.
   */
  Incomplete = 'incomplete',
  /**
   * Describes that a rule is violated but ignored due to the effect of another rule.
   */
  Ignored = 'ignored',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace State {
  export function isSatisfied(state: State): boolean {
    return state === State.Satisfied || state === State.Ignored;
  }
}

export type RuleState =
  | {
      readonly state: State.Error;
      readonly positions: readonly Position[];
    }
  | {
      readonly state: State.Satisfied;
    }
  | {
      readonly state: State.Incomplete;
    }
  | {
      readonly state: State.Ignored;
    };

export interface GridState {
  final: State;
  rules: readonly RuleState[];
  symbols: ReadonlyMap<string, State[]>;
}

export enum Color {
  Dark = 'dark',
  Light = 'light',
  Gray = 'gray',
}

export enum Comparison {
  Equal = 'eq',
  AtLeast = 'ge',
  AtMost = 'le',
}

export const COMPARISONS: readonly Comparison[] = [
  Comparison.Equal,
  Comparison.AtLeast,
  Comparison.AtMost,
];

export enum Wrapping {
  None = 'none',
  Wrap = 'wrap',
  WrapReverse = 'wrap-reverse',
  ReflectReverse = 'reflect-reverse',
}

export const WRAPPINGS: readonly Wrapping[] = [
  Wrapping.None,
  Wrapping.Wrap,
  Wrapping.WrapReverse,
  Wrapping.ReflectReverse,
];

export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export const DIRECTIONS: readonly Direction[] = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
];

export type DirectionMap<T> = Record<Direction, T>;

export type DirectionToggle = Readonly<DirectionMap<boolean>>;

export function directionToggle(...directions: readonly Direction[]) {
  const result = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  for (const direction of directions) {
    result[direction] = true;
  }
  return result;
}

export enum Orientation {
  Up = 'up',
  UpRight = 'up-right',
  Right = 'right',
  DownRight = 'down-right',
  Down = 'down',
  DownLeft = 'down-left',
  Left = 'left',
  UpLeft = 'up-left',
}

export const ORIENTATIONS: readonly Orientation[] = [
  Orientation.Up,
  Orientation.UpRight,
  Orientation.Right,
  Orientation.DownRight,
  Orientation.Down,
  Orientation.DownLeft,
  Orientation.Left,
  Orientation.UpLeft,
];

export type OrientationMap<T> = Record<Orientation, T>;

export type OrientationToggle = Readonly<OrientationMap<boolean>>;

export function orientationToggle(...orientations: readonly Orientation[]) {
  const result = {
    up: false,
    'up-right': false,
    right: false,
    'down-right': false,
    down: false,
    'down-left': false,
    left: false,
    'up-left': false,
  };
  for (const orientation of orientations) {
    result[orientation] = true;
  }
  return result;
}

export enum Mode {
  Create = 'create',
  Solve = 'solve',
  Perfection = 'perfection',
}

export enum Instrument {
  Piano = 'piano',
  Drum = 'drum',
  Violin = 'violin',
  Xylophone = 'xylophone',
  GuitarAcoustic = 'guitar-acoustic',
  GuitarElectric = 'guitar-electric',
  Flute = 'flute',
  Trumpet = 'trumpet',
}

export const INSTRUMENTS: readonly Instrument[] = [
  Instrument.Piano,
  Instrument.Drum,
  Instrument.Violin,
  Instrument.Xylophone,
  Instrument.GuitarAcoustic,
  Instrument.GuitarElectric,
  Instrument.Flute,
  Instrument.Trumpet,
];

export const DRUM_SAMPLES = [
  'snare',
  'kick',
  'hihat',
  'hihat-open',
  'crash',
  'tom',
  'rim',
] as const;

export function isDrumSample(note: string): boolean {
  return DRUM_SAMPLES.includes(note as (typeof DRUM_SAMPLES)[number]);
}
