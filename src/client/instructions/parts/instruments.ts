import MusicGridRule from '@logic-pad/core/data/rules/musicGridRule';
import { Piano } from '@logic-pad/piano';
import GridData from '@logic-pad/core/data/grid';
import * as Tone from 'tone';
import {
  Color,
  Instrument as InstrumentType,
  DRUM_SAMPLES as DRUM_SAMPLES_RAW,
  isDrumSample,
} from '@logic-pad/core/data/primitives';
import { sampleLibrary } from './tonejsInstruments';
import { noteNames } from '../../configs/parts/NullableNoteConfig';

type EventData =
  | { type: 'pedal'; value: boolean }
  | {
      type: 'keydown';
      value: string;
      instrument: InstrumentType;
      velocity: number;
      seed: number;
    }
  | { type: 'keyup'; value: string; instrument: InstrumentType; seed: number }
  | { type: 'bpm'; value: number }
  | { type: 'complete' };

const tonejsInstruments = [
  InstrumentType.Violin,
  InstrumentType.Xylophone,
  InstrumentType.GuitarAcoustic,
  InstrumentType.GuitarElectric,
  InstrumentType.Flute,
  InstrumentType.Trumpet,
] as const;

export const playbackState = {
  /**
   * Indicates that the current playback is a solution, thus the tile animations should be disabled.
   */
  isSolution: false,
  checkpoint: 0,
  playback: undefined as CachedPlayback | undefined,
};

class Loadable<T> {
  public value: T | null = null;
  public loader: () => Promise<T>;

  public constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  public async load() {
    if (this.value) return this.value;
    this.value = await this.loader();
    return this.value;
  }

  public static from<T>(loader: () => Promise<T>) {
    return new Loadable(loader);
  }
}

function spinWaitAsync(predicate: () => boolean, interval = 100) {
  return new Promise<void>(resolve => {
    const handle = setInterval(() => {
      if (predicate()) {
        clearInterval(handle);
        resolve();
      }
    }, interval);
  });
}

function detune(note: string, seed: number) {
  return Tone.Midi(note).toFrequency() * (1 + (seed - 0.5) * 0.007);
}

export const instruments = {
  piano: Loadable.from(async () => {
    console.time('Loading piano samples');
    const inst = {
      regular: new Piano({
        release: false,
        pedal: false,
        velocities: 1,
        maxPolyphony: 32,
      }).toDestination(),
      immediate: new Piano({
        release: false,
        pedal: false,
        velocities: 1,
        maxPolyphony: 32,
      }).toDestination(),
      immediatePedal: new Piano({
        release: false,
        pedal: false,
        velocities: 1,
        maxPolyphony: 32,
      }).toDestination(),
    };
    await Promise.all([
      inst.regular.load(),
      inst.immediate.load(),
      inst.immediatePedal.load(),
    ]);
    console.timeEnd('Loading piano samples');
    return inst;
  }),
  drum: Loadable.from(async () => {
    console.time('Loading drum samples');
    const inst: Record<(typeof DRUM_SAMPLES_RAW)[number], Tone.Player> = {
      snare: new Tone.Player('/samples/snare.wav').toDestination(),
      kick: new Tone.Player('/samples/kick.wav').toDestination(),
      hihat: new Tone.Player('/samples/hihat.wav').toDestination(),
      'hihat-open': new Tone.Player('/samples/hihat-open.wav').toDestination(),
      crash: new Tone.Player('/samples/crash.wav').toDestination(),
      tom: new Tone.Player('/samples/tom.wav').toDestination(),
      rim: new Tone.Player('/samples/rim.wav').toDestination(),
    };
    await spinWaitAsync(() =>
      Object.values(inst).every(player => player.loaded)
    );
    console.timeEnd('Loading drum samples');
    return inst;
  }),
  ...(Object.fromEntries(
    tonejsInstruments.map(instrument => [
      instrument,
      Loadable.from(async () => {
        console.time(`Loading ${instrument} samples`);
        const inst = sampleLibrary.load({
          instruments: [instrument],
        });
        await spinWaitAsync(() => inst[instrument].loaded);
        console.timeEnd(`Loading ${instrument} samples`);
        return inst[instrument].toDestination();
      }),
    ])
  ) as Record<(typeof tonejsInstruments)[number], Loadable<Tone.Sampler>>),
} as const satisfies Record<InstrumentType, Loadable<any>>;

export type Instrument = keyof typeof instruments;

const c5Midi = Tone.Midi('C5').toMidi();
const e4Midi = Tone.Midi('E4').toMidi();
const e3Midi = Tone.Midi('E3').toMidi();
const e2Midi = Tone.Midi('E2').toMidi();

function normalizeVelocity(
  velocity: number,
  note: string,
  instrument: InstrumentType,
  applyNormalization: boolean
): number {
  if (!applyNormalization) return velocity;

  // the default velocity is 0.5 but drum samples are louder so their base velocity is 0.7
  if (isDrumSample(note) || instrument === InstrumentType.Drum)
    return (velocity - 0.7) * 20;

  if (instrument === InstrumentType.Piano) {
    const midi = Tone.Midi(note).toMidi();
    velocity += 0.2;
    if (midi > c5Midi) return velocity;
    velocity -= 0.2;
    if (midi > e4Midi) return velocity;
    velocity -= 0.05;
    if (midi > e3Midi) return velocity;
    velocity -= 0.03;
    if (midi > e2Midi) return velocity;
    velocity -= 0.01;
    return velocity;
  }

  if (velocity < 0.4) {
    return velocity / 2 + 0.05;
  } else {
    return velocity - 0.195;
  }
}

export function getInstrumentsUsed(instruction: MusicGridRule) {
  const instruments = new Set<InstrumentType>();
  const height = instruction.controlLines
    .map(line => line.rows.length)
    .reduce((a, b) => Math.max(a, b), 0);
  const width =
    instruction.controlLines
      .map(line => line.column)
      .reduce((a, b) => Math.max(a, b), 0) + 1;

  const rows: {
    note: string | null;
    instrument: InstrumentType;
  }[] = Array.from({ length: height }, () => ({
    note: null,
    instrument: InstrumentType.Piano,
  }));

  for (let x = 0; x < width; x++) {
    const line = instruction.controlLines.find(line => line.column === x);
    if (line) {
      line.rows.forEach((row, j) => {
        if (j >= rows.length) return;
        if (row.note !== null) {
          rows[j].note = row.note;
        }
        if (row.instrument !== null) {
          rows[j].instrument = row.instrument;
        }
      });
    }
    rows.forEach(row => {
      if (row.note && isDrumSample(row.note)) {
        instruments.add(InstrumentType.Drum);
      } else if (row.instrument) {
        instruments.add(row.instrument);
      } else if (row.note) {
        instruments.add(InstrumentType.Piano);
      }
    });
  }

  return instruments;
}

export function encodePlayback(
  grid: GridData,
  musicGrid: MusicGridRule,
  onComplete?: () => void
): () => void {
  // prepare events
  let bpm = 120;
  let pedal = false;
  const rows: {
    note: string | null;
    instrument: InstrumentType;
    velocity: number | null;
  }[] = Array.from({ length: grid.height }, () => ({
    note: null,
    instrument: InstrumentType.Piano,
    velocity: 0.5,
  }));
  const events = new Map<Tone.Unit.Time, EventData[]>();
  const addEvent = (time: Tone.Unit.Time, event: EventData) => {
    const existing = events.get(time);
    if (existing) {
      existing.push(event);
    } else {
      events.set(time, [event]);
    }
  };
  for (let x = 0; x < grid.width; x++) {
    const line = musicGrid.controlLines.find(line => line.column === x);
    if (line) {
      if (line.bpm !== null && line.bpm !== bpm) {
        addEvent(x / 2, { type: 'bpm', value: line.bpm });
        bpm = line.bpm;
      }
      if (line.pedal !== null && line.pedal !== pedal) {
        addEvent(x / 2, { type: 'pedal', value: line.pedal });
        pedal = line.pedal;
      }
      line.rows.forEach((row, j) => {
        if (j >= rows.length) return;
        if (row.note !== null) {
          rows[j].note = row.note;
        }
        if (row.instrument !== null) {
          rows[j].instrument = row.instrument;
        }
        if (row.velocity !== null) {
          rows[j].velocity = row.velocity;
        }
      });
    }
    rows.forEach((row, y) => {
      if (row.note === null || row.velocity === null) return;
      const tile = grid.getTile(x, y);
      if (
        tile.exists &&
        tile.color === Color.Dark &&
        !grid.connections.hasEdge({ x1: x, y1: y, x2: x - 1, y2: y })
      ) {
        if (!noteNames.includes(row.note)) return;
        const seed = Math.random();
        addEvent(x / 2, {
          type: 'keydown',
          value: row.note,
          instrument: row.instrument,
          velocity: row.velocity,
          seed,
        });
        let endPos = { x, y };
        while (
          grid.connections.hasEdge({
            x1: endPos.x,
            y1: endPos.y,
            x2: endPos.x + 1,
            y2: endPos.y,
          })
        ) {
          endPos = { x: endPos.x + 1, y: endPos.y };
        }
        addEvent((endPos.x + 1) / 2, {
          type: 'keyup',
          value: row.note,
          instrument: row.instrument,
          seed,
        });
      }
    });
  }
  addEvent(grid.width / 2, { type: 'complete' });

  // reset bpm to 120 before encoding because the time values are bpm-dependent
  Tone.getTransport().bpm.value = 120;

  // create part
  const notes = new Tone.Part(
    (time, event) => {
      event.forEach(event => {
        switch (event.type) {
          case 'bpm':
            Tone.getTransport().bpm.setValueAtTime(event.value, time);
            break;
          case 'pedal':
            if (event.value) {
              instruments.piano.value?.regular.pedalDown({ time });
            } else {
              instruments.piano.value?.regular.pedalUp({ time });
            }
            break;
          case 'keydown':
            if (
              isDrumSample(event.value) ||
              event.instrument === InstrumentType.Drum
            ) {
              instruments.drum.value?.[
                event.value as keyof typeof instruments.drum.value
              ]?.volume.setValueAtTime(
                normalizeVelocity(
                  event.velocity,
                  event.value,
                  event.instrument,
                  musicGrid.normalizeVelocity
                ),
                time
              );
              instruments.drum.value?.[
                event.value as keyof typeof instruments.drum.value
              ]?.start(time, 0);
            } else if (event.instrument === InstrumentType.Piano) {
              instruments.piano.value?.regular.keyDown({
                note: event.value,
                velocity: normalizeVelocity(
                  event.velocity,
                  event.value,
                  event.instrument,
                  musicGrid.normalizeVelocity
                ),
                time,
              });
            } else {
              instruments[event.instrument]?.value?.triggerAttack(
                detune(event.value, event.seed),
                time,
                normalizeVelocity(
                  event.velocity,
                  event.value,
                  event.instrument,
                  musicGrid.normalizeVelocity
                )
              );
            }
            break;
          case 'keyup':
            if (
              isDrumSample(event.value) ||
              event.instrument === InstrumentType.Drum
            ) {
              instruments.drum.value?.[
                event.value as keyof typeof instruments.drum.value
              ].stop(time);
            } else if (event.instrument === InstrumentType.Piano) {
              instruments.piano.value?.regular.keyUp({
                note: event.value,
                time,
              });
            } else {
              instruments[event.instrument]?.value?.triggerRelease(
                detune(event.value, event.seed),
                time
              );
            }
            break;
          case 'complete':
            onComplete?.();
            break;
        }
      });
    },
    [...events.entries()]
  ).start(0);
  notes.humanize = '0.01n';

  // return clean-up function
  return () => {
    notes.dispose();
  };
}

export function encodeImmediate(
  grid: GridData,
  oldGrid: GridData,
  musicGrid: MusicGridRule
) {
  // set the piano to the correct state
  instruments.piano.value?.immediate.pedalUp();
  instruments.piano.value?.immediatePedal.pedalDown();
  tonejsInstruments.forEach(instrument =>
    instruments[instrument]?.value?.releaseAll()
  );

  // a small hack to hide the progress line if no grid is currently playing
  if (Tone.getTransport().state !== 'started')
    Tone.getTransport().ticks = Tone.getTransport().PPQ * grid.width * 2;

  let remainingPolyphony = 2;

  // prepare events
  let bpm = 120;
  let pedal = false;
  const rows: {
    note: string | null;
    instrument: InstrumentType;
    velocity: number | null;
  }[] = Array.from({ length: grid.height }, () => ({
    note: null,
    instrument: InstrumentType.Piano,
    velocity: 0.5,
  }));

  for (let x = 0; x < grid.width; x++) {
    const line = musicGrid.controlLines.find(line => line.column === x);
    if (line) {
      if (line.bpm !== null && line.bpm !== bpm) {
        bpm = line.bpm;
      }
      if (line.pedal !== null && line.pedal !== pedal) {
        pedal = line.pedal;
      }
      line.rows.forEach((row, j) => {
        if (j >= rows.length) return;
        if (row.note !== null) {
          rows[j].note = row.note;
        }
        if (row.instrument !== null) {
          rows[j].instrument = row.instrument;
        }
        if (row.velocity !== null) {
          rows[j].velocity = row.velocity;
        }
      });
    }
    rows.forEach((row, y) => {
      if (row.note === null || row.velocity === null) return;
      if (!noteNames.includes(row.note)) return;
      if (remainingPolyphony <= 0) return;
      const tile = grid.getTile(x, y);
      const oldTile = oldGrid.getTile(x, y);
      if (
        tile.exists &&
        tile.color === Color.Dark &&
        (!oldTile.exists || oldTile.color !== Color.Dark) &&
        !grid.connections.hasEdge({ x1: x, y1: y, x2: x - 1, y2: y })
      ) {
        const targetPiano = pedal
          ? instruments.piano.value?.immediatePedal
          : instruments.piano.value?.immediate;
        if (isDrumSample(row.note) || row.instrument === InstrumentType.Drum) {
          instruments.drum.value?.[
            row.note as keyof typeof instruments.drum.value
          ].volume.setValueAtTime(
            normalizeVelocity(
              row.velocity,
              row.note,
              row.instrument,
              musicGrid.normalizeVelocity
            ),
            Tone.immediate()
          );
          instruments.drum.value?.[
            row.note as keyof typeof instruments.drum.value
          ].start(0, 0);
        } else if (row.instrument === InstrumentType.Piano) {
          targetPiano?.keyDown({
            note: row.note,
            velocity: normalizeVelocity(
              row.velocity,
              row.note,
              row.instrument,
              musicGrid.normalizeVelocity
            ),
          });
        } else {
          instruments[row.instrument]?.value?.triggerAttack(
            row.note,
            Tone.immediate(),
            normalizeVelocity(
              row.velocity,
              row.note,
              row.instrument,
              musicGrid.normalizeVelocity
            )
          );
        }
        remainingPolyphony--;
        let endPos = { x, y };
        while (
          grid.connections.hasEdge({
            x1: endPos.x,
            y1: endPos.y,
            x2: endPos.x + 1,
            y2: endPos.y,
          })
        ) {
          endPos = { x: endPos.x + 1, y: endPos.y };
        }
        const time = `+${(((endPos.x + 1) / 2 - x / 2) * 120 * 120) / Tone.getTransport().bpm.value / bpm}`;
        if (isDrumSample(row.note) || row.instrument === InstrumentType.Drum) {
          // do nothing for the moment
          // TODO: consider pedal state?
          // drum[row.note as keyof typeof drum].stop(time);
        } else if (row.instrument === InstrumentType.Piano) {
          targetPiano?.keyUp({
            note: row.note,
            velocity: row.velocity,
            time,
          });
        } else {
          instruments[row.instrument]?.value?.triggerRelease(row.note, time);
        }
      }
    });
  }
}

export interface CachedPlayback {
  grid: GridData | null;
  cleanUp: () => void;
}

export function playGrid(
  grid: GridData,
  musicGrid: MusicGridRule,
  isSolution: boolean,
  onComplete?: () => void,
  cache?: CachedPlayback
): CachedPlayback {
  playbackState.isSolution = isSolution;
  Tone.getTransport().stop();
  instruments.piano.value?.regular.stopAll();
  tonejsInstruments.forEach(instrument =>
    instruments[instrument]?.value?.releaseAll()
  );
  if (!cache?.grid?.equals(grid)) {
    cache?.cleanUp?.();
    cache = {
      grid,
      cleanUp: encodePlayback(grid, musicGrid, onComplete),
    };
  }
  Tone.getTransport().start();
  Tone.getTransport().ticks =
    playbackState.checkpoint * Tone.getTransport().PPQ;
  Tone.getTransport().bpm.value = musicGrid.controlLines
    .filter(line => line.column <= playbackState.checkpoint)
    .reduce((a, b) => b.bpm ?? a, 120);
  const pedal = musicGrid.controlLines
    .filter(line => line.column <= playbackState.checkpoint)
    .reduce((a, b) => b.pedal ?? a, false);
  if (pedal) {
    instruments.piano.value?.regular.pedalDown();
  } else {
    instruments.piano.value?.regular.pedalUp();
  }
  return cache;
}

export function playImmediate(
  grid: GridData,
  oldGrid: GridData,
  musicGrid: MusicGridRule
) {
  encodeImmediate(grid, oldGrid, musicGrid);
  Tone.getTransport().start();
}

export function cleanUp(cache?: CachedPlayback) {
  cache?.cleanUp();
  if (cache) cache.grid = null;
  Tone.getTransport().stop();
  instruments.piano.value?.regular.stopAll();
  tonejsInstruments.forEach(instrument =>
    instruments[instrument]?.value?.releaseAll()
  );
}
