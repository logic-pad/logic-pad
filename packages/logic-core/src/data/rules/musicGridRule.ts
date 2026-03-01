import { AnyConfig, ConfigType } from '../config.js';
import { GridChangeHandler } from '../events/onGridChange.js';
import { GridResizeHandler } from '../events/onGridResize.js';
import { SetGridHandler } from '../events/onSetGrid.js';
import GridData from '../grid.js';
import { resize } from '../dataHelper.js';
import {
  Color,
  Instrument,
  MajorRule,
  RuleState,
  State,
} from '../primitives.js';
import CustomIconSymbol from '../symbols/customIconSymbol.js';
import { ControlLine, Row } from './musicControlLine.js';
import Rule, { SearchVariant } from './rule.js';

const DEFAULT_SCALE = [
  new Row('C5', Instrument.Piano, null),
  new Row('B4', Instrument.Piano, null),
  new Row('A4', Instrument.Piano, null),
  new Row('G4', Instrument.Piano, null),
  new Row('F4', Instrument.Piano, null),
  new Row('E4', Instrument.Piano, null),
  new Row('D4', Instrument.Piano, null),
  new Row('C4', Instrument.Piano, null),
];

export default class MusicGridRule
  extends Rule
  implements GridChangeHandler, SetGridHandler, GridResizeHandler
{
  public readonly title = 'Music Grid';

  public get configExplanation() {
    return 'Solve the grid by listening to the solution being played back.';
  }

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['.']).addSymbol(
      new CustomIconSymbol('', GridData.create([]), 0, 0, 'MdMusicNote')
    )
  );

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.ControlLines,
      default: [new ControlLine(0, 120, false, false, DEFAULT_SCALE)],
      field: 'controlLines',
      description: 'Control Lines',
      configurable: false,
    },
    {
      type: ConfigType.NullableGrid,
      default: null,
      nonNullDefault: GridData.create([
        'wwwww',
        'wwwww',
        'wwwww',
        'wwwww',
      ]).addRule(
        new MusicGridRule(
          [new ControlLine(0, 120, false, false, DEFAULT_SCALE)],
          null
        )
      ),
      field: 'track',
      description: 'Track',
      explanation: 'If set, this grid will be played instead of the solution.',
      configurable: true,
    },
    {
      type: ConfigType.Boolean,
      default: true,
      field: 'normalizeVelocity',
      description: 'Normalize Velocity',
      explanation:
        'Whether to adjust note velocities by their pitch such that every note has the same perceived loudness.',
      configurable: true,
    },
  ]);

  private static readonly SEARCH_VARIANTS = [
    new MusicGridRule(
      [new ControlLine(0, 120, false, false, DEFAULT_SCALE)],
      null
    ).searchVariant(),
  ];

  /**
   * **Music Grid: Listen to the solution**
   * @param controlLines Denote changes in the playback settings. At least one control line at column 0 should be present to enable playback.
   * @param track The grid to be played when "listen" is clicked. Set as null to play the solution.
   * @param normalizeVelocity Whether to normalize the velocity of the notes by their pitch such that lower notes are played softer.
   */
  public constructor(
    public readonly controlLines: readonly ControlLine[],
    public readonly track: GridData | null,
    public readonly normalizeVelocity = true
  ) {
    super();
    this.controlLines = MusicGridRule.deduplicateControlLines(controlLines);
    this.track = track;
    this.normalizeVelocity = normalizeVelocity;
  }

  public get id(): string {
    return MajorRule.MusicGrid;
  }

  public get explanation(): string {
    return `*Music Grid:* Listen to the solution`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return MusicGridRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return MusicGridRule.EXAMPLE_GRID;
  }

  public get searchVariants(): SearchVariant[] {
    return MusicGridRule.SEARCH_VARIANTS;
  }

  public validateGrid(_grid: GridData): RuleState {
    return { state: State.Incomplete };
  }

  public onSetGrid(
    _oldGrid: GridData,
    newGrid: GridData,
    _solution: GridData | null
  ): GridData {
    if (newGrid.getTileCount(true, undefined, Color.Gray) === 0) return newGrid;
    const tiles = newGrid.tiles.map(row =>
      row.map(tile =>
        tile.color === Color.Gray ? tile.withColor(Color.Light) : tile
      )
    );
    return newGrid.copyWith({ tiles });
  }

  public onGridChange(newGrid: GridData): this {
    if (this.controlLines.length === 0) return this;
    if (
      newGrid.height === this.controlLines[0].rows.length &&
      !this.controlLines.some(line => line.column >= newGrid.width)
    )
      return this;
    const controlLines = this.controlLines
      .filter(line => line.column < newGrid.width)
      .map(line =>
        line.withRows(
          resize(line.rows, newGrid.height, () => new Row(null, null, null))
        )
      );
    return this.copyWith({ controlLines });
  }

  public onGridResize(
    _grid: GridData,
    mode: 'insert' | 'remove',
    direction: 'row' | 'column',
    index: number
  ): this | null {
    if (mode === 'insert') {
      if (direction === 'row') {
        return this.copyWith({
          controlLines: this.controlLines.map(line => {
            const rows = line.rows.slice();
            rows.splice(index, 0, new Row(null, null, null));
            return line.withRows(rows);
          }),
        });
      } else if (direction === 'column') {
        return this.copyWith({
          controlLines: this.controlLines.map(line =>
            line.column >= index ? line.withColumn(line.column + 1) : line
          ),
        });
      }
    } else if (mode === 'remove') {
      if (direction === 'row') {
        return this.copyWith({
          controlLines: this.controlLines.map(line =>
            line.withRows(line.rows.filter((_, idx) => idx !== index))
          ),
        });
      } else if (direction === 'column') {
        const lines: ControlLine[] = [];
        for (const line of this.controlLines) {
          if (line.column === index) {
            const nextLine = this.controlLines.find(
              l => l.column === index + 1
            );
            if (nextLine) {
              lines.push(MusicGridRule.mergeControlLines(line, nextLine));
            } else {
              lines.push(line.withColumn(index));
            }
          } else if (line.column > index) {
            lines.push(line.withColumn(line.column - 1));
          } else {
            lines.push(line);
          }
        }
        return this.copyWith({ controlLines: lines });
      }
    }
    return this;
  }

  /**
   * Add or replace a control line.
   * @param controlLine The control line to set.
   * @returns A new rule with the control line set.
   */
  public setControlLine(controlLine: ControlLine): this {
    const controlLines = this.controlLines.filter(
      line => line.column !== controlLine.column
    );
    return this.copyWith({
      controlLines: [...controlLines, controlLine].sort(
        (a, b) => a.column - b.column
      ),
    });
  }

  public withTrack(track: GridData | null): this {
    return this.copyWith({ track });
  }

  public copyWith({
    controlLines,
    track,
    normalizeVelocity,
  }: {
    controlLines?: readonly ControlLine[];
    track?: GridData | null;
    normalizeVelocity?: boolean;
  }): this {
    return new MusicGridRule(
      controlLines ?? this.controlLines,
      track !== undefined ? track : this.track,
      normalizeVelocity ?? this.normalizeVelocity
    ) as this;
  }

  public get validateWithSolution(): boolean {
    return true;
  }

  public get isSingleton(): boolean {
    return true;
  }

  public static mergeControlLines(...lines: ControlLine[]): ControlLine {
    const rows = Array.from(
      { length: Math.max(...lines.map(l => l.rows.length)) },
      (_, idx) => {
        const note = lines
          .map(l => l.rows[idx]?.note)
          .reduce((a, b) => b ?? a, null);
        const instrument = lines
          .map(l => l.rows[idx]?.instrument)
          .reduce((a, b) => b ?? a, null);
        const velocity = lines
          .map(l => l.rows[idx]?.velocity)
          .reduce((a, b) => b ?? a, null);
        return new Row(note, instrument, velocity);
      }
    );
    const bpm = lines.map(l => l.bpm).reduce((a, b) => b ?? a, null);
    const pedal = lines.map(l => l.pedal).reduce((a, b) => b ?? a, null);
    const checkpoint = lines.some(l => l.checkpoint);
    return new ControlLine(lines[0].column, bpm, pedal, checkpoint, rows);
  }

  public static deduplicateControlLines(
    lines: readonly ControlLine[]
  ): ControlLine[] {
    const columns = new Map<number, ControlLine[]>();
    for (const line of lines) {
      if (!columns.has(line.column)) {
        columns.set(line.column, [line]);
      } else {
        columns.get(line.column)!.push(line);
      }
    }
    return Array.from(columns.values()).map(lines =>
      lines.length > 1 ? MusicGridRule.mergeControlLines(...lines) : lines[0]
    );
  }
}

export const instance = new MusicGridRule(
  [new ControlLine(0, 120, false, false, DEFAULT_SCALE)],
  null
);
