/* prettier-ignore-start */

/* eslint-disable */

declare type PuzzleData_2 = any;
declare namespace z {
  type ZodObject<A0 = any, A1 = any> = any;
  type ZodString = any;
  type ZodNumber = any;
  namespace core {
    type $strict = any;
  }
  type ZodCustom<A0 = any, A1 = any> = any;
  type ZodNullable<A0 = any> = any;
}

declare function aggregateState(rules: readonly RuleState[], grid: GridData, symbols: ReadonlyMap<string, State[]>): State.Error | State.Satisfied | State.Incomplete;

/**
 * Check if all the given values are equal.
 * @param values The values to compare.
 * @returns Whether all the values are equal.
 */
declare function allEqual<T>(...values: T[]): boolean;

declare const allRules: Map<string, Rule>;

declare const allSolvers: Map<string, Solver>;

declare const allSymbols: Map<string, _Symbol>;

declare type AnyConfig = BooleanConfig | NullableBooleanConfig | NumberConfig | NullableNumberConfig | StringConfig | ColorConfig | ComparisonConfig | WrappingConfig | DirectionConfig | DirectionToggleConfig | OrientationConfig | OrientationToggleConfig | TileConfig | ShapeConfig | GridConfig | NullableGridConfig | IconConfig | ControlLinesConfig | NullableNoteConfig | NullableInstrumentConfig | SolvePathConfig;

/** The image of a cell under the symmetry. Only integral for cell-preserving symmetries. */
declare function apply(symmetry: Symmetry, x: number, y: number): Position_2;

declare function applyFinalOverrides(grid: GridData, solution: GridData | null, state: GridState): GridState;

declare class Area {
    readonly id: AreaId;
    readonly color: Color;
    readonly positions: Position_2[];
    readonly symbols: _Symbol[];
    constructor(id: AreaId, color: Color, positions?: Position_2[], symbols?: _Symbol[]);
    copy(): Area;
}

declare function area(representative: Position_2 | Position_2[]): string;

declare type AreaId = PositionValue & {
    [areaSymbol]: 'area';
};

declare class AreaNumberBTModule extends BTModule {
    instr: AreaNumberSymbol;
    constructor(instr: AreaNumberSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
    checkLocal(grid: BTGridData, positions: Position_2[]): CheckResult | boolean;
}

declare class AreaNumberSymbol extends NumberSymbol {
    readonly title = "Area Number";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Area Numbers must equal region sizes**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param number - The area number.
     */
    constructor(x: number, y: number, number: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    } | null;
    copyWith({ x, y, number, }: {
        x?: number;
        y?: number;
        number?: number;
    }): this;
    withNumber(number: number): this;
}

declare type AreaPair = `${AreaId},${AreaId}`;

declare class AreaStore extends InsightStore {
    readonly id = "area";
    private _cells;
    private _areaList;
    constructor(context: InsightContext);
    get cells(): readonly (readonly (Area | null)[])[];
    get areaList(): readonly Area[];
    get(position: Position_2 | PositionValue): Area | null;
    onGridUpdate(): void;
    copyWithContext(context: InsightContext): this;
    private recompute;
    toPositionValue(x: number, y: number): PositionValue;
    toPosition(positionValue: PositionValue): Position_2;
}

declare const areaSymbol: unique symbol;

/**
 * Create a new 2D array with the given dimensions and values.
 * @param width The width of the array.
 * @param height The height of the array.
 * @param value A function that returns the value for each x,y coordinate.
 * @returns The 2D array.
 */
declare function array<T>(width: number, height: number, value: (x: number, y: number) => T): T[][];

declare const _Array: readonly InsightLemma[];

declare class AutoSolver extends Solver {
    readonly id = "auto";
    readonly author = "various contributors";
    readonly description = "Automatically select the fastest solver based on supported instructions and environment.";
    readonly supportsCancellation = true;
    private static readonly nonAdditiveInstructions;
    isGridSupported(grid: GridData): boolean;
    isInstructionSupported(grid: GridData, instruction: Instruction): boolean;
    protected isEnvironmentSupported(): Promise<boolean>;
    private fillSolution;
    private fixGrid;
    private solveWithProgress;
    private solveOne;
    solve(grid: GridData, abortSignal?: AbortSignal): AsyncGenerator<GridData | null>;
}

declare class BacktrackSolver extends EventIteratingSolver {
    private static readonly supportedInstrs;
    readonly id = "backtrack";
    readonly author = "ALaggyDev";
    readonly description = "Solves puzzles pretty fast using backtracking with optimizations. Support most rules and symbols (including underclued).";
    protected createWorker(): Worker;
    isInstructionSupported(_grid: GridData, instruction: Instruction): boolean;
}

declare class BanPatternBTModule extends BTModule {
    instr: BanPatternRule;
    constructor(instr: BanPatternRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
    checkLocal(grid: BTGridData, positions: Position_2[]): CheckResult | false;
}

declare class BanPatternRule extends Rule {
    readonly title = "Ban Pattern";
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    readonly pattern: GridData;
    readonly cache: Shape[];
    /**
     * **Don't make this pattern**
     *
     * @param pattern - GridData representing the banned pattern. Only non-gray tiles are considered.
     */
    constructor(pattern: GridData);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ pattern }: {
        pattern?: GridData;
    }): this;
    withPattern(pattern: GridData): this;
}

declare interface BooleanConfig extends Config<boolean> {
    readonly type: ConfigType.Boolean;
}

declare class BreakBannedPattern extends InsightLemma {
    readonly id = "break-banned-pattern";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    /** Canonical key of the merged tile containing the given cell. */
    private tileKey;
}

declare type BTColor = BTTile.Dark | BTTile.Light;

declare class BTGridData {
    readonly tiles: BTTile[][];
    readonly connections: Position_2[][][];
    readonly modules: BTModule[];
    readonly width: number;
    readonly height: number;
    constructor(tiles: BTTile[][], connections: Position_2[][][], modules: BTModule[], width: number, height: number);
    getTile(x: number, y: number): BTTile;
    setTileWithConnection(x: number, y: number, tile: BTTile): void;
    isInBound(x: number, y: number): boolean;
    getEdges(pos: Position_2): Position_2[];
    clone(): BTGridData;
}

declare abstract class BTModule {
    abstract checkGlobal(grid: BTGridData): CheckResult | false;
    checkLocal(grid: BTGridData, _: Position_2[]): CheckResult | boolean;
}

declare enum BTTile {
    Empty = 0,
    Dark = 1,
    Light = 2,
    NonExist = 3
}

declare class CachedAccess<T> {
    private readonly getter;
    private static readonly UNCACHED;
    private cache;
    private constructor();
    static of<T>(getter: () => T): CachedAccess<T>;
    get value(): T;
}

declare function cell(cell: Position_2 | Position_2[]): string;

declare class CellCountBTModule extends BTModule {
    instr: CellCountRule;
    constructor(instr: CellCountRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare abstract class CellCountPerZoneRule extends Rule {
    readonly color: Color;
    get configExplanation(): string;
    /**
     * @param color - The color of the cells to count.
     */
    constructor(color: Color);
    protected getZoneCounts(grid: GridData): ZoneCounts;
    withColor(color: Color): this;
}

declare class CellCountRule extends Rule {
    readonly color: Color;
    readonly count: number;
    readonly title = "Total Count";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **There are &lt;count&gt; &lt;color&gt; cells in total**
     *
     * @param color - The color of the cells to count.
     * @param count - The total number of cells of the given color.
     */
    constructor(color: Color, count: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color, count }: {
        color?: Color;
        count?: number;
    }): this;
    withColor(color: Color): this;
    withCount(count: number): this;
}

declare interface CheckResult {
    tilesNeedCheck: IntArray2D | null;
    ratings: Rating[] | null;
}

declare function checkSubtilePlacement(grid: BTGridData, pos: Position_2): CheckResult | false | undefined;

declare class ChecksumCompressor extends CompressorBase {
    get id(): string;
    compress(input: string): Promise<string>;
    decompress(_input: string): Promise<string>;
}

declare enum Color {
    Dark = "dark",
    Light = "light",
    Gray = "gray"
}

declare interface ColorConfig extends Config<Color> {
    readonly type: ConfigType.Color;
    readonly allowGray: boolean;
}

/**
 * Colors gray areas that belong to a region whose color is already known. Lemmas can deduce
 * that a gray area is connected to a region (e.g. forced region expansion connecting a
 * bottleneck) without coloring its cells; since every cell of a region shares its color,
 * those gray cells must take the region's color.
 */
declare class ColorConnectedRegions extends InsightLemma {
    readonly id = "color-connected-regions";
    isApplicable(_grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class ColorDisconnectedRegions extends InsightLemma {
    readonly id = "color-disconnected-regions";
    isApplicable(_grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private applyToRegion;
}

declare function colorToBTTile(color: Color): BTTile;

/**
 * Forces the cells in a viewpoint's line of sight whose color is decided by the viewpoint's count.
 *
 * A viewpoint sees a contiguous run of its own color in each of the four directions, plus its own
 * cell.
 *
 * 1. A gray cell that sits `i` cells into a run of length `L` hides `L - i` cells (itself and
 *    everything beyond it) if it is colored with the opposite color. When that loss is larger than
 *    the number of cells the viewpoint could otherwise afford to lose, the cell cannot be the
 *    opposite color, so it must match the viewpoint.
 * 2. Conversely, coloring a gray cell with the viewpoint's color extends the run in its direction
 *    to the next blocking cell, which may reach past cells that are already colored. When the
 *    resulting count exceeds the viewpoint's number, the cell must be the opposite color.
 *
 * Both deductions act on the whole merged tile that holds the cell.
 *
 * Under an off-by-X rule the viewpoint admits several values, so each rule is applied at the
 * extreme where it holds for **every** surviving value: losing a cell is intolerable if it breaks
 * even the smallest value, and a coloring is excessive only if it exceeds the largest one.
 */
declare class ColorViewpointSight extends InsightLemma {
    readonly id = "color-viewpoint-sight";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private applyToSymbol;
    /**
     * Colors the gray cells that the viewpoint cannot afford to lose, because the cells they would
     * hide are more than the slack between what is visible at most and the smallest value the
     * viewpoint could hold.
     *
     * Hiding is counted per **merged tile**, summed over every direction it touches. A tile can sit
     * in two runs at once, and coloring it opposite stops both, so it hides the union of the two
     * tails even though each tail on its own would fit inside the slack. Within one direction only
     * the nearest cell of the tile matters, because that is where the run stops.
     */
    private forceVisible;
    /**
     * Colors the gray cells that would make the viewpoint see more cells than any value it could
     * hold if they took its color.
     */
    private forceBlocked;
    /**
     * The number of cells the viewpoint would see if the cells in `asColor` shared its color.
     */
    private visibleCount;
    /** A canonical key identifying a merged tile by its cells. */
    private tileKey;
    /** Whether the merged tile holding the given cell can be recolored to `color`. */
    private canColor;
    private analyzeDirection;
}

declare enum Comparison {
    Equal = "eq",
    AtLeast = "ge",
    AtMost = "le"
}

declare interface ComparisonConfig extends Config<Comparison> {
    readonly type: ConfigType.Comparison;
}

declare const COMPARISONS: readonly Comparison[];

/**
 * Completes darts by treating each merged tile that they see as a single unit that either
 * contributes all of its cells or none of them to the dart's count:
 *
 * 1. The dart still needs `value - opposite` opposite-colored cells, where `opposite` is the
 *    number of opposite-colored cells that it already sees.
 * 2. The gray cells that the dart sees are grouped by merged tile, so each group contributes
 *    either its full size or nothing to the remaining count.
 * 3. Every group is then classified by the combinations that add up to the remaining count: one
 *    that appears in no combination must share the dart's color, and one that appears in every
 *    combination must be opposite-colored. Groups that appear in some but not all combinations are
 *    left for a later step, once the other groups have narrowed the count down.
 *
 * Under an off-by-X rule a dart admits two values, so each candidate is tested separately: a
 * candidate with no satisfying combination is eliminated through the number symbol store, and a
 * group is only colored when the verdict agrees on **every** surviving candidate.
 *
 * Classifying by combination membership covers the direct cases as well: a group bigger than the
 * remaining count is in no combination, a group large enough that the rest cannot reach the count
 * without it is in every combination, and when the combinations collapse to a single one every
 * group is decided at once.
 *
 * Grids that wrap around are ignored because the cells seen by a dart cannot be enumerated
 * reliably there.
 */
declare class CompleteDart extends InsightLemma {
    readonly id = "complete-dart";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private applyToSymbol;
    private groupByMergedTile;
}

declare class CompleteGalaxy extends InsightLemma {
    readonly id = "complete-galaxy";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * Completes lotus symbols by enforcing the reflection symmetry of the regions that contain them.
 *
 * Unlike galaxies, which cannot share a region because a shape has at most one center of
 * rotational symmetry, several lotuses can describe the same region as long as their axes are
 * compatible: parallel axes must coincide, and non-parallel axes simply add further constraints.
 *
 * 1. Every cell of the region must have a mirror that exists and belongs to the region, and
 *    mirrored cells must share the region's color, otherwise the grid is in an invalid state.
 * 2. A gray cell of the region whose mirror is already colored must take that color.
 * 3. Mirroring is an involution, so a gray cell whose mirror belongs to the region must join it
 *    and take its color.
 * 4. A gray cell adjacent to the region whose mirror is known to be outside the region cannot
 *    join the region, so it must take the opposite color.
 */
declare class CompleteLotus extends InsightLemma {
    readonly id = "complete-lotus";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    /**
     * Returns one axis per reflection of the region, throwing when two lotuses describe distinct
     * parallel axes, which no finite region could be symmetrical across.
     */
    private distinctAxes;
    private completeForAxis;
}

declare class CompletePatternRule extends Rule {
    readonly title = "Complete The Pattern";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Complete the pattern**
     *
     * This rule validates answers based on the provided solution.
     */
    constructor();
    get id(): string;
    get explanation(): string;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_grid: GridData): RuleState;
    copyWith(_: object): this;
    get validateWithSolution(): boolean;
    get isSingleton(): boolean;
}

/**
 * Completes regions whose size is constrained, whether by an area number symbol or by a region
 * area size rule, using the region size store to obtain the possible sizes.
 *
 * If the region needs at least as many cells as are available, every available cell must belong to
 * it. If the region can hold at most as many cells as it already has, it is complete and must be
 * surrounded by the opposite color.
 */
declare class CompleteRegionSize extends InsightLemma {
    readonly id = "complete-region-size";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class CompleteSubtileSymbol extends InsightLemma {
    readonly id = "complete-subtile-symbol";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * Completes viewpoint numbers by directly counting visible cells in the four directions:
 *
 * 1. If the total available space in the four directions equals the number, all of it must be
 *    visible, so every gray cell in it is filled with the symbol's color.
 * 2. If only one direction still has potential space, the number must be fully expanded in that
 *    direction, so the nearest gray cells there are filled with the symbol's color.
 * 3. If the number is complete, every direction must end with an opposite-colored cell or no cell,
 *    so gray cells right after a completed run are filled with the opposite color.
 *
 * Under an off-by-X rule the viewpoint admits two values, so each is eliminated when the counted
 * range cannot reach it, and the rules that need an exact number only fire once a single value
 * survives. The other two gate on the extreme surviving values, which holds for every candidate.
 */
declare class CompleteViewpoint extends InsightLemma {
    readonly id = "complete-viewpoint";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private applyToSymbol;
    private analyzeDirection;
}

/** The transformation `a` applied after `b`. */
declare function compose(a: Symmetry, b: Symmetry): Symmetry;

declare const Compressor: MasterCompressor;

declare abstract class CompressorBase {
    /**
     * The unique identifier for this compressor.
     */
    abstract get id(): string;
    /**
     * Compress the given input string into URL-safe compressed string.
     * @param input The input string to compress.
     */
    abstract compress(input: string): Promise<string>;
    /**
     * Decompress the given compressed string back into the original string.
     * @param input The compressed string to decompress.
     */
    abstract decompress(input: string): Promise<string>;
}

declare interface Config<T> {
    readonly type: ConfigType;
    readonly field: string;
    readonly description: string;
    readonly explanation?: string;
    readonly default: T;
    readonly configurable: boolean;
}

/**
 * Compare two config values for equality, using an appropriate method for the config type.
 *
 * @param type The type of the config.
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns Whether the two values are equal.
 */
declare function configEquals<C extends AnyConfig>(type: C['type'], a: C['default'], b: C['default']): boolean;

declare enum ConfigType {
    Boolean = "boolean",
    NullableBoolean = "nullableBoolean",
    Number = "number",
    NullableNumber = "nullableNumber",
    String = "string",
    Color = "color",
    Comparison = "comparison",
    Wrapping = "wrapping",
    Direction = "direction",
    DirectionToggle = "directionToggle",
    Orientation = "orientation",
    OrientationToggle = "orientationToggle",
    Tile = "tile",
    Shape = "shape",
    Grid = "grid",
    NullableGrid = "nullableGrid",
    Icon = "icon",
    ControlLines = "controlLines",
    NullableNote = "nullableNote",
    NullableInstrument = "nullableInstrument",
    SolvePath = "solvePath"
}

declare abstract class Configurable {
    abstract get title(): string;
    abstract get configExplanation(): string;
    get configs(): readonly AnyConfig[] | null;
    abstract copyWith(props: Record<string, unknown>): this;
    /**
     * Check if this instruction is equal to another instruction by comparing their IDs and configs.
     *
     * @param other The other instruction to compare to.
     * @returns Whether the two instructions are equal.
     */
    equals(other: Configurable): boolean;
}

declare class ConnectAllBTModule extends BTModule {
    instr: ConnectAllRule;
    constructor(instr: ConnectAllRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare class ConnectAllCells extends InsightLemma {
    readonly id = "connect-all-cells";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class ConnectAllRemovesDisconnectedRegions extends InsightLemma {
    readonly id = "connect-all-removes-disconnected-regions";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class ConnectAllRule extends Rule {
    readonly color: Color;
    readonly title = "Connect All";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Connect all &lt;color&gt; cells**
     *
     * @param color - The color of the cells to connect.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
    withColor(color: Color): this;
}

/**
 * Connects regions that contain the same letter: letters must be sorted into one type per
 * area, so all cells with the same letter belong to the same region.
 */
declare class ConnectSameLetters extends InsightLemma {
    readonly id = "connect-same-letters";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * Fills articulation points (bottlenecks) that a region must pass through to connect its areas.
 *
 * An articulation point only qualifies if removing it splits the region's graph into parts where
 * at least two parts each contain an area of the region — being an articulation point on the
 * shortest path between two areas is not sufficient, since the areas might still connect through
 * an alternative route while the articulation point only separates off an irrelevant branch.
 * The articulation point's own node counts as a part when it contains a region area: such an area
 * is logically connected to the region but still gray, so the bottleneck must be filled to
 * realize the connection.
 */
declare class ConnectThroughBottleneck extends InsightLemma {
    readonly id = "connect-through-bottleneck";
    isApplicable(_grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class ConnectZonesRule extends Rule {
    readonly color: Color;
    readonly title = "Connect Zones";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Connect all &lt;color&gt; cells in each zone**
     *
     * @param color - The color of the cells to connect.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
    withColor(color: Color): this;
}

declare class ContainsShapeRule extends RegionShapeRule {
    readonly title = "Areas Contain Pattern";
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    readonly pattern: GridData;
    readonly cache: Shape[];
    /**
     * **All &lt;color&gt; areas must contain this pattern**
     *
     * @param color - The color of the regions to compare.
     * @param pattern - GridData representing the required pattern. Only non-gray tiles are considered.
     */
    constructor(color: Color, pattern: GridData);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color, pattern, }: {
        color?: Color;
        pattern?: GridData;
    }): this;
    withPattern(pattern: GridData): this;
}

declare class ControlLine extends Configurable {
    readonly column: number;
    readonly bpm: number | null;
    readonly pedal: boolean | null;
    readonly checkpoint: boolean;
    readonly rows: readonly Row[];
    readonly title = "Music Grid - Control Line";
    readonly configExplanation = "Configure the playback settings from this point onwards.";
    private static readonly CONFIGS;
    /**
     * Configure playback settings, taking effect at the given column (inclusive)
     * @param column The column at which the settings take effect
     * @param bpm The new beats per minute, or null to keep the current value from the previous control line
     * @param pedal Whether the pedal is pressed, or null to keep the current value from the previous control line
     * @param checkpoint Whether this control line is a checkpoint
     * @param rows The notes to play at each row. This list is automatically resized to match the height of the grid. You may pass in an empty list if none of the rows need to be changed.
     */
    constructor(column: number, bpm: number | null, pedal: boolean | null, checkpoint: boolean, rows: readonly Row[]);
    get configs(): readonly AnyConfig[] | null;
    copyWith({ column, bpm, pedal, checkpoint, rows, }: {
        column?: number;
        bpm?: number | null;
        pedal?: boolean | null;
        checkpoint?: boolean;
        rows?: readonly Row[];
    }): this;
    withColumn(column: number): this;
    withBpm(bpm: number | null): this;
    withPedal(pedal: boolean | null): this;
    withCheckpoint(checkpoint: boolean): this;
    withRows(rows: readonly Row[]): this;
    equals(other: ControlLine): boolean;
    get isEmpty(): boolean;
}

declare interface ControlLinesConfig extends Config<ControlLine[]> {
    readonly type: ConfigType.ControlLines;
}

declare function createOneTileResult(grid: BTGridData, pos: Position_2, score?: number | undefined): CheckResult;

declare class CspuzSolver extends EventIteratingSolver {
    private static readonly supportedInstrs;
    readonly id = "cspuz";
    readonly author = "semiexp";
    readonly description = "A blazingly fast WebAssembly solver that supports most rules and symbols (including underclued).";
    protected createWorker(): Worker;
    isGridSupported(grid: GridData): boolean;
    isInstructionSupported(grid: GridData, instruction: Instruction): boolean;
    isEnvironmentSupported(): Promise<boolean>;
}

declare class CustomIconSymbol extends CustomSymbol {
    readonly icon: string;
    readonly rotation: number;
    readonly title = "Custom Icon Symbol";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    /**
     * **A custom icon symbol**
     *
     * @param description - The description of the symbol. Leave this empty to hide the description.
     * @param grid - The thumbnail grid of the rule, preferably 5x4 in size.
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param icon - The icon to display. All available icons can be found at https://react-icons.github.io/react-icons/icons/md/
     * @param rotation - The rotation of the icon in degrees.
     */
    constructor(description: string, grid: GridData, x: number, y: number, icon: string, rotation?: number);
    get id(): string;
    get configs(): readonly AnyConfig[] | null;
    copyWith({ description, grid, x, y, icon, rotation, }: {
        description?: string;
        grid?: GridData;
        x?: number;
        y?: number;
        icon?: string;
        rotation?: number;
    }): this;
    withIcon(icon: string): this;
    withRotation(rotation: number): this;
}

declare class CustomRule extends Rule {
    readonly description: string;
    readonly grid: GridData;
    readonly title = "Custom Rule";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    static readonly configs: readonly AnyConfig[];
    private static readonly SEARCH_VARIANTS;
    /**
     * A custom rule with a description and thumbnail grid.
     *
     * This rule validates answers based on the provided solution.
     *
     * @param description - The description of the rule.
     * @param grid - The thumbnail grid of the rule, preferably 5x4 in size.
     */
    constructor(description: string, grid: GridData);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_grid: GridData): RuleState;
    copyWith({ description, grid, }: {
        description?: string;
        grid?: GridData;
    }): this;
    get validateWithSolution(): boolean;
}

declare abstract class CustomSymbol extends _Symbol implements SymbolMergeHandler {
    readonly description: string;
    readonly grid: GridData;
    /**
     * **A custom symbol**
     *
     * @param description - The description of the symbol. Leave this empty to hide the description.
     * @param grid - The thumbnail grid of the rule, preferably 5x4 in size.
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     */
    constructor(description: string, grid: GridData, x: number, y: number);
    get explanation(): string;
    createExampleGrid(): GridData;
    validateSymbol(_grid: GridData): State;
    get validateWithSolution(): boolean;
    descriptionEquals(other: _Symbol): boolean;
    withDescription(description: string): this;
    withGrid(grid: GridData): this;
}

declare class CustomTextSymbol extends CustomSymbol {
    readonly text: string;
    readonly rotation: number;
    readonly title = "Custom Text Symbol";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    /**
     * **A custom text symbol**
     *
     * @param description - The description of the symbol. Leave this empty to hide the description.
     * @param grid - The thumbnail grid of the rule, preferably 5x4 in size.
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param text - The text to display.
     * @param rotation - The rotation of the text in degrees.
     */
    constructor(description: string, grid: GridData, x: number, y: number, text: string, rotation?: number);
    get id(): string;
    get configs(): readonly AnyConfig[] | null;
    copyWith({ description, grid, x, y, text, rotation, }: {
        description?: string;
        grid?: GridData;
        x?: number;
        y?: number;
        text?: string;
        rotation?: number;
    }): this;
    withText(text: string): this;
    withRotation(rotation: number): this;
}

declare class DartBTModule extends BTModule {
    instr: DartSymbol;
    constructor(instr: DartSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private buildCheckAndRating;
}

declare class DartSymbol extends NumberSymbol {
    readonly orientation: Orientation;
    readonly title = "Dart";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Darts count opposite color cells in that direction**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param number - The number of cells seen by the symbol.
     * @param orientation - The orientation of the symbol.
     */
    constructor(x: number, y: number, number: number, orientation: Orientation);
    get id(): string;
    get placementStep(): number;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    };
    copyWith({ x, y, number, orientation, }: {
        x?: number;
        y?: number;
        number?: number;
        orientation?: Orientation;
    }): this;
    withNumber(number: number): this;
}

declare class DeflateCompressor extends StreamCompressor {
    get id(): string;
    protected get algorithm(): CompressionFormat;
    compress(input: string): Promise<string>;
    decompress(input: string): Promise<string>;
}

declare class DifferentCountPerZoneRule extends CellCountPerZoneRule {
    readonly color: Color;
    readonly title = "Different Count Per Zone";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly EXAMPLE_GRID_GRAY;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Zones of the same size have different numbers of &lt;color&gt; cells.**
     *
     * @param color - The color of the cells to count.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
}

declare enum Direction {
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right"
}

declare interface DirectionConfig extends Config<Direction> {
    readonly type: ConfigType.Direction;
}

declare abstract class DirectionLinkerBTModule extends BTModule {
    instr: DirectionLinkerSymbol;
    constructor(instr: DirectionLinkerSymbol);
    private initialPositions;
    private getInitialPositions;
    checkGlobal(grid: BTGridData): CheckResult | false;
    protected abstract movePos(grid: BTGridData, x: number, y: number): Position_2 | null;
}

declare type DirectionLinkerMap = Record<Direction, Direction>;

declare abstract class DirectionLinkerSymbol extends _Symbol {
    readonly x: number;
    readonly y: number;
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    private static readonly directionDeltas;
    private linkedDirections;
    /**
     * **Darts count opposite color cells in that direction**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     */
    constructor(x: number, y: number);
    changeDirections(linkedDirections: DirectionLinkerMap): this;
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    private deltaCoordinate;
    validateSymbol(grid: GridData): State;
    private getInitialCheckedCouples;
}

declare type DirectionMap<T> = Record<Direction, T>;

declare const DIRECTIONS: readonly Direction[];

declare type DirectionToggle = Readonly<DirectionMap<boolean>>;

declare function directionToggle(...directions: readonly Direction[]): {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
};

declare interface DirectionToggleConfig extends Config<DirectionToggle> {
    readonly type: ConfigType.DirectionToggle;
}

/**
 * Convert the given direction to a rotation in degrees.
 * @param direction The direction to convert.
 * @returns The rotation in degrees.
 */
declare function directionToRotation(direction: Direction): 0 | 90 | 180 | 270;

/**
 * Disconnects regions that contain different letters: letters must be sorted into one type
 * per area, so cells with different letters can never belong to the same region.
 */
declare class DisconnectDifferentLetters extends InsightLemma {
    readonly id = "disconnect-different-letters";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * Disconnects regions whose possible sizes do not overlap: two regions cannot merge if they
 * cannot have the same region size. The possibilities come from the region size store, so both
 * area number symbols and region area size rules are covered.
 */
declare class DisconnectIncompatibleRegionSizes extends InsightLemma {
    readonly id = "disconnect-incompatible-region-sizes";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    /** True when a cell of one region is orthogonally adjacent to a cell of the other. */
    private areAdjacent;
}

/**
 * Disconnects regions whose combined symbol count would violate a symbols per area rule.
 *
 * Only rules that bound the count from above (`exactly` and `at most`) can produce such a
 * contradiction, so `at least` rules are ignored. A region pair is considered when both could end
 * up in the rule's color, and at least one of them already has that color determined: two gray
 * regions may still merge into a region of the opposite color, which the rule does not constrain.
 *
 * Symbols are counted the same way the rule validates them: a symbol belongs to a region when it
 * touches one of the region's confirmed cells, and a symbol shared by both regions is only counted
 * once.
 */
declare class DisconnectIncompatibleSymbolCounts extends InsightLemma {
    readonly id = "disconnect-incompatible-symbol-counts";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    /** The symbols that the merged region would contain, counted once each. */
    private mergedSymbols;
}

/**
 * Disconnects regions that cannot be merged because their combined region could not satisfy every
 * symmetry symbol it would contain.
 *
 * A region holding a galaxy or a lotus must be invariant under the corresponding isometry, so a
 * merged region must be invariant under the whole group generated by the symmetries it contains.
 * Merging is impossible when either:
 *
 * 1. The generated group contains a translation, which happens as soon as two symbols demand
 *    distinct parallel axes, or two different centers. No finite region is invariant under it.
 * 2. A cell of the merged region has no room for its image, because the mirrored cell is off-grid,
 *    does not exist, or is known to belong to neither region.
 *
 * The second case covers regions that carry no symmetry symbol of their own as well: their cells
 * still have to be matched by the other region's symbols.
 */
declare class DisconnectIncompatibleSymmetries extends InsightLemma {
    readonly id = "disconnect-incompatible-symmetries";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    /** The symmetry symbols of a region, each contributing one isometry. */
    private constraintsOf;
    private mergeBlocker;
}

declare class DisjointSet<T extends number, Rep extends T> {
    private parent;
    private rank;
    constructor(size: number);
    find(value: T): Rep;
    union(a: T, b: T): void;
    copy(): DisjointSet<T, Rep>;
}

declare const DRUM_SAMPLES: readonly ['snare', 'kick', 'hihat', 'hihat-open', 'crash', 'tom', 'rim'];

declare interface Edge {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
}

/**
 * Escape the given text by replacing the specified characters with HTML escape sequences.
 * @param text The text to escape.
 * @param escapeCharacters The characters to escape.
 * @returns The escaped text.
 */
declare function escape(text: string, escapeCharacters?: string): string;

declare abstract class EventIteratingSolver extends Solver {
    readonly supportsCancellation = true;
    protected abstract createWorker(): Worker;
    protected isEnvironmentSupported(): Promise<boolean>;
    protected preprocessGrid(grid: GridData): GridData;
    solve(grid: GridData, abortSignal?: AbortSignal): AsyncGenerator<GridData | null>;
}

declare class EveryLetterSymbol extends _Symbol {
    readonly x: number;
    readonly y: number;
    readonly letter: string;
    readonly title = "Hollow Letter";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Include each Hollow Letter once per region**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param letter - The letter of the symbol.
     */
    constructor(x: number, y: number, letter: string);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(grid: GridData): State;
    copyWith({ x, y, letter, }: {
        x?: number;
        y?: number;
        letter?: string;
    }): this;
    withLetter(letter: string): this;
}

declare class ExactCountPerZoneRule extends CellCountPerZoneRule {
    readonly color: Color;
    readonly count: number;
    readonly title = "Exact Count Per Zone";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly EXAMPLE_GRID_GRAY;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Each zone has &lt;count&gt; &lt;color&gt; cells.**
     *
     * @param color - The color of the cells to count.
     * @param count - The exact count of the cells in each zone.
     */
    constructor(color: Color, count: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color, count }: {
        color?: Color;
        count?: number;
    }): this;
}

declare interface FinalValidationHandler {
    /**
     * Edits the final grid state after all rules and symbols have been validated.
     *
     * @param grid The grid that is being validated.
     * @param solution The solution grid, or null if the solution is not available.
     * @param state The current state of the grid.
     */
    onFinalValidation(grid: GridData, solution: GridData | null, state: GridState): GridState;
}

declare class FocusBTModule extends BTModule {
    instr: FocusSymbol;
    private cachedCheckResult?;
    constructor(instr: FocusSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private buildCheckAndRating;
}

declare class FocusSymbol extends NumberSymbol implements SymbolMergeHandler {
    readonly deadEnd: boolean;
    get title(): string;
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    private static readonly EXAMPLE_GRID_DEAD_END;
    /**
     * **Focus Numbers count directly adjacent cells of the same color**
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param deadEnd - Whether this Focus Number is a Dead End.
     * @param number - The focus number.
     */
    constructor(x: number, y: number, deadEnd: boolean, number: number);
    get id(): string;
    get placementStep(): number;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    private countForColor;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    };
    descriptionEquals(other: _Symbol): boolean;
    copyWith({ x, y, deadEnd, number, }: {
        x?: number;
        y?: number;
        deadEnd?: boolean;
        number?: number;
    }): this;
    withNumber(number: number): this;
    withDeadEnd(deadEnd: boolean): this;
}

/**
 * Forces a region to expand through an articulation point of its region graph when the cells that
 * would remain reachable without it are fewer than the region's deduced minimum size.
 *
 * For each candidate bottleneck — an articulation point that is not already part of the region —
 * the graph is split by removing that single cell. If all of the region's cells stay in one
 * component and that component offers fewer cells than the region needs, the region cannot
 * afford to leave the bottleneck empty, so it must absorb it.
 *
 * Bottlenecks are evaluated one at a time rather than all at once: a narrow corridor attached to
 * the region consists of articulation points itself, and removing them together would shred the
 * corridor into pieces that individually look irrelevant, hiding the fact that the whole
 * corridor is too small to satisfy the region on its own.
 */
declare class ForcedRegionExpansion extends InsightLemma {
    readonly id = "forced-region-expansion";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class ForesightRule extends Rule {
    readonly count: number;
    readonly regenInterval: number;
    readonly startFull: boolean;
    readonly solvePath: Position_2[];
    readonly title = "Foresight";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Foresight: Show hints**
     */
    constructor(count: number, regenInterval: number, startFull: boolean, solvePath?: Position_2[]);
    get id(): string;
    get explanation(): string;
    get visibleWhenSolving(): boolean;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_grid: GridData): RuleState;
    get necessaryForCompletion(): boolean;
    get isSingleton(): boolean;
    modeVariant(mode: Mode): Rule | null;
    copyWith({ count, regenInterval, startFull, solvePath, }: {
        count?: number;
        regenInterval?: number;
        startFull?: boolean;
        solvePath?: Position_2[];
    }): this;
}

declare class GalaxyBTModule extends DirectionLinkerBTModule {
    instr: GalaxySymbol;
    constructor(instr: GalaxySymbol);
    protected movePos(grid: BTGridData, x: number, y: number): Position_2 | null;
}

declare class GalaxySymbol extends DirectionLinkerSymbol {
    readonly x: number;
    readonly y: number;
    readonly title = "Galaxy";
    private static readonly linkedDirections;
    /**
     * **Galaxies are centers of rotational symmetry**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     */
    constructor(x: number, y: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(grid: GridData): State;
    copyWith({ x, y }: {
        x?: number;
        y?: number;
    }): this;
}

/**
 * Closes the given symmetries under composition.
 *
 * Every generator has a linear part in the symmetry group of the square, which has eight
 * elements, so a finite group generated by them has at most eight elements: anything larger must
 * contain a translation.
 */
declare function generateGroup(generators: readonly Symmetry[], limit?: number): SymmetryGroup;

declare function getOppositeColor(color: BTColor): BTColor;

/**
 * Get the types of a puzzle based on its grid properties. The returned types are ordered by their priority.
 * The first type is the most important one.
 */
declare function getPuzzleTypes(grid: GridData): PuzzleType[];

declare function getShapeVariants(shape: Shape): Shape[];

declare interface GetTileHandler {
    onGetTile(x: number, y: number, grid: GridData): Position_2;
}

declare const graphSymbol: unique symbol;

declare interface GridChangeHandler {
    onGridChange(newGrid: GridData): this;
}

declare interface GridConfig extends Config<GridData> {
    readonly type: ConfigType.Grid;
}

declare class GridConnections extends GridZones {
    constructor(edges?: readonly Edge[]);
    addEdge(edge: Edge): GridConnections;
    removeEdge(edge: Edge): GridConnections;
    getForTile({ x, y }: Position_2): TileConnections;
    getConnectedTiles({ x, y }: Position_2): readonly Position_2[];
    /**
     * Create new GridConnections from a string array.
     *
     * - Use `.` for cells that don't connect to anything.
     * - Use any other character for cells that connect to the same character.
     *
     * @param array - The string array to create the connections from.
     * @returns The created connections. You can apply this to a GridData object using GridData.withConnections.
     */
    static create(array: string[]): GridConnections;
    static validateEdges(connections: GridConnections, width: number, height: number): GridConnections;
    insertColumn(index: number): GridConnections;
    insertRow(index: number): GridConnections;
    removeColumn(index: number): GridConnections;
    removeRow(index: number): GridConnections;
}

declare class GridData {
    readonly width: number;
    readonly height: number;
    readonly tiles: readonly (readonly TileData[])[];
    readonly connections: GridConnections;
    readonly zones: GridZones;
    readonly symbols: ReadonlyMap<string, readonly _Symbol[]>;
    readonly rules: readonly Rule[];
    readonly musicGrid: CachedAccess<MusicGridRule | undefined>;
    readonly completePattern: CachedAccess<CompletePatternRule | undefined>;
    readonly underclued: CachedAccess<UndercluedRule | undefined>;
    readonly wrapAround: CachedAccess<WrapAroundRule | undefined>;
    /**
     * Create a new grid with tiles, connections, symbols and rules.
     *
     * @param width The width of the grid.
     * @param height The height of the grid.
     * @param tiles The tiles of the grid.
     * @param connections The connections of the grid, which determines which tiles are merged.
     * @param zones The zones of the grid.
     * @param symbols The symbols in the grid.
     * @param rules The rules of the grid.
     */
    constructor(width: number, height: number, tiles?: readonly (readonly TileData[])[], connections?: GridConnections, zones?: GridZones, symbols?: ReadonlyMap<string, readonly _Symbol[]>, rules?: readonly Rule[]);
    /**
     * Create a new GridData object from a string array.
     *
     * - Use `b` for dark cells, `w` for light cells, and `n` for gray cells.
     * - Capitalize the letter to make the tile fixed.
     * - Use `.` to represent empty space.
     *
     * @param array - The string array to create the grid from.
     * @returns The created grid.
     */
    static create(array: string[]): GridData;
    /**
     * Create a new grid with tiles, connections, symbols and rules. Sanitize the provided list of symbols and rules,
     * and trigger grid change events.
     *
     * @param width The width of the grid.
     * @param height The height of the grid.
     * @param tiles The tiles of the grid.
     * @param connections The connections of the grid, which determines which tiles are merged.
     * @param zones The zones of the grid.
     * @param symbols The symbols in the grid.
     * @param rules The rules of the grid.
     */
    static create(width: number, height: number, tiles?: readonly (readonly TileData[])[], connections?: GridConnections, zones?: GridZones, symbols?: ReadonlyMap<string, readonly _Symbol[]>, rules?: readonly Rule[], sanitize?: boolean, triggerEvents?: boolean): GridData;
    /**
     * Copy the current grid while modifying the provided properties.
     * @param param0 The properties to modify.
     * @returns The new grid with the modified properties.
     */
    copyWith({ width, height, tiles, connections, zones, symbols, rules, }: {
        width?: number;
        height?: number;
        tiles?: readonly (readonly TileData[])[];
        connections?: GridConnections;
        zones?: GridZones;
        symbols?: ReadonlyMap<string, readonly _Symbol[]>;
        rules?: readonly Rule[];
    }, sanitize?: boolean, triggerEvents?: boolean): GridData;
    toArrayCoordinates(x: number, y: number): Position_2;
    isPositionValid(x: number, y: number): boolean;
    /**
     * Safely get the tile at the given position.
     * @param x The x-coordinate of the tile.
     * @param y The y-coordinate of the tile.
     * @returns The tile at the given position, or a non-existent tile if the position is invalid.
     */
    getTile(x: number, y: number): TileData;
    /**
     * Safely set the tile at the given position.
     * If the position is invalid, the tile array is returned unchanged.
     * If the tile is merged with other tiles, the colors of all connected tiles are changed.
     *
     * @param x The x-coordinate of the tile.
     * @param y The y-coordinate of the tile.
     * @param tile The new tile to set.
     * @returns The new tile array with updated tiles.
     */
    setTile(x: number, y: number, tile: TileData | ((tile: TileData) => TileData)): readonly (readonly TileData[])[];
    /**
     * Replace or modify all tiles in the grid.
     *
     * @param tiles The new tile array or a function to mutate the existing tile array.
     * @returns The new grid with the new tiles.
     */
    withTiles(tiles: readonly (readonly TileData[])[] | ((value: TileData[][]) => readonly (readonly TileData[])[])): GridData;
    /**
     * Add or modify the connections in the grid.
     * @param connections The new connections to add or modify.
     * @returns The new grid with the new connections.
     */
    withConnections(connections: GridConnections | ((value: GridConnections) => GridConnections)): GridData;
    /**
     * Add or modify the zones in the grid.
     * @param zones The new zones to add or modify.
     * @returns The new grid with the new zones.
     */
    withZones(zones: GridZones | ((value: GridZones) => GridZones)): GridData;
    /**
     * Add or modify the symbols in the grid.
     * @param symbols The new symbols to add or modify.
     * @returns The new grid with the new symbols.
     */
    withSymbols(symbols: readonly _Symbol[] | ReadonlyMap<string, readonly _Symbol[]> | ((value: Map<string, readonly _Symbol[]>) => ReadonlyMap<string, readonly _Symbol[]>)): GridData;
    /**
     * Add a new symbol to the grid.
     * @param symbol The symbol to add.
     * @returns The new grid with the new symbol.
     */
    addSymbol(symbol: _Symbol): GridData;
    /**
     * Remove an instance of the symbol from the grid.
     * @param symbol The symbol to remove.
     * @returns The new grid with the symbol removed.
     */
    removeSymbol(symbol: _Symbol): GridData;
    /**
     * Remove all symbols that satisfy the predicate.
     * @param predicate The predicate to test each symbol with.
     * @returns The new grid with the symbols removed.
     */
    removeSymbolIf(predicate: (symbol: _Symbol) => boolean): GridData;
    /**
     * Find the first symbol that satisfies the predicate.
     * @param predicate The predicate to test each symbol with.
     * @returns The first symbol that satisfies the predicate, or undefined if no symbol is found.
     */
    findSymbol(predicate: (symbol: _Symbol) => boolean): _Symbol | undefined;
    /**
     * Replace an existing symbol with a new symbol.
     * @param oldSymbol The symbol to replace.
     * @param newSymbol The new symbol to replace with.
     * @returns The new grid with the symbol replaced.
     */
    replaceSymbol(oldSymbol: _Symbol, newSymbol: _Symbol): GridData;
    /**
     * Add or modify the rules in the grid.
     * @param rules The new rules to add or modify.
     * @returns The new grid with the new rules.
     */
    withRules(rules: readonly Rule[] | ((value: readonly Rule[]) => readonly Rule[])): GridData;
    /**
     * Add a new rule to the grid.
     * @param rule The rule to add.
     * @returns The new grid with the new rule.
     */
    addRule(rule: Rule): GridData;
    /**
     * Remove an instance of the rule from the grid.
     * @param rule The rule to remove.
     * @returns The new grid with the rule removed.
     */
    removeRule(rule: Rule): GridData;
    /**
     * Remove all rules that satisfy the predicate.
     * @param predicate The predicate to test each rule with.
     * @returns The new grid with the rules removed.
     */
    removeRuleIf(predicate: (rule: Rule) => boolean): GridData;
    /**
     * Find the first rule that satisfies the predicate.
     * @param predicate The predicate to test each rule with.
     * @returns The first rule that satisfies the predicate, or undefined if no rule is found.
     */
    findRule(predicate: (rule: Rule) => boolean): Rule | undefined;
    /**
     * Replace an existing rule with a new rule.
     * @param oldRule The rule to replace.
     * @param newRule The new rule to replace with.
     * @returns The new grid with the rule replaced.
     */
    replaceRule(oldRule: Rule, newRule: Rule): GridData;
    /**
     * Insert a new column at the given index, shifting all components of the grid accordingly. Newly inserted tiles are gray.
     * @param index The index to insert the column at.
     * @returns The new grid with the new column inserted.
     */
    insertColumn(index: number): GridData;
    /**
     * Insert a new row at the given index, shifting all components of the grid accordingly. Newly inserted tiles are gray.
     * @param index The index to insert the row at.
     * @returns The new grid with the new row inserted.
     */
    insertRow(index: number): GridData;
    /**
     * Remove a column at the given index, shifting all components of the grid accordingly.
     * @param index The index to remove the column at.
     * @returns The new grid with the column removed.
     */
    removeColumn(index: number): GridData;
    /**
     * Remove a row at the given index, shifting all components of the grid accordingly.
     * @param index The index to remove the row at.
     * @returns The new grid with the row removed.
     */
    removeRow(index: number): GridData;
    /**
     * Resize the grid to the new width and height, shifting all components of the grid accordingly. Newly inserted tiles are gray.
     * @param width The new width of the grid.
     * @param height The new height of the grid.
     * @returns The new grid with the new dimensions.
     */
    resize(width: number, height: number): this;
    /**
     * Create a new mutable TileData array from a string array.
     *
     * - Use `b` for dark cells, `w` for light cells, and `n` for gray cells.
     * - Capitalize the letter to make the tile fixed.
     * - Use `.` to represent empty space.
     *
     * @param array - The string array to create the tiles from.
     * @returns The created tile array.
     */
    static createTiles(array: string[]): TileData[][];
    /**
     * Find a tile in the grid that satisfies the predicate.
     *
     * @param predicate The predicate to test each tile with.
     * @returns The position of the first tile that satisfies the predicate, or undefined if no tile is found.
     */
    find(predicate: (tile: TileData, x: number, y: number) => boolean): Position_2 | undefined;
    /**
     * Iterate over all tiles in the same region as the given position that satisfy the predicate.
     * The iteration stops when the callback returns a value that is not undefined.
     * Non-existent tiles are not included in the iteration.
     *
     * @param position The position to start the iteration from. This position is included in the iteration.
     * @param predicate The predicate to test each tile with. The callback is only called for tiles that satisfy this predicate.
     * @param callback The callback to call for each tile that satisfies the predicate. The iteration stops when this callback returns a value that is not undefined.
     * @param visited A 2D array to keep track of visited tiles. This array is modified by the function.
     * @returns The value returned by the callback that stopped the iteration, or undefined if the iteration completed.
     */
    iterateArea<T>(position: Position_2, predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean, callback: (tile: TileData, x: number, y: number, logicalX: number, logicalY: number) => undefined | T, visited?: boolean[][]): T | undefined;
    /**
     * Iterate over all tiles in a straight line from the given position in the given direction that satisfy the predicate.
     * The iteration stops when the callback returns a value that is not undefined.
     * Non-existent tiles break the iteration.
     *
     * @param position The position to start the iteration from. This position is included in the iteration.
     * @param direction The direction to iterate in.
     * @param predicate The predicate to test each tile with. The callback is only called for tiles that satisfy this predicate.
     * @param callback The callback to call for each tile that satisfies the predicate. The iteration stops when this callback returns a value that is not undefined.
     * @param visited A 2D array to keep track of visited tiles. This array is modified by the function.
     * @returns The value returned by the callback that stopped the iteration, or undefined if the iteration completed.
     */
    iterateDirection<T>(position: Position_2, direction: Direction | Orientation, predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean, callback: (tile: TileData, x: number, y: number, logicalX: number, logicalY: number) => T | undefined, visited?: boolean[][]): T | undefined;
    /**
     * Iterate over all tiles in a straight line from the given position in the given direction that satisfy the predicate.
     * The iteration stops when the callback returns a value that is not undefined.
     * Non-existent tiles are included in the iteration.
     *
     * @param position The position to start the iteration from. This position is included in the iteration.
     * @param direction The direction to iterate in.
     * @param predicate The predicate to test each tile with. The callback is only called for tiles that satisfy this predicate.
     * @param callback The callback to call for each tile that satisfies the predicate. The iteration stops when this callback returns a value that is not undefined.
     * @param visited A 2D array to keep track of visited tiles. This array is modified by the function.
     * @returns The value returned by the callback that stopped the iteration, or undefined if the iteration completed.
     */
    iterateDirectionAll<T>(position: Position_2, direction: Direction | Orientation, predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean, callback: (tile: TileData, x: number, y: number, logicalX: number, logicalY: number) => T | undefined, visited?: boolean[][]): T | undefined;
    /**
     * Reduce the grid by zones defined in the GridZones.
     *
     * @param reducer The reducer function to apply to each zone.
     * @param initializer The initializer function to create the initial value for each zone.
     * @param visited A 2D array to keep track of visited tiles. This array is modified by the function.
     * @returns An array of reduced values, one for each zone.
     */
    reduceByZone<T>(reducer: (acc: T, tile: TileData, x: number, y: number, logicalX: number, logicalY: number) => T, initializer: () => T, visited?: boolean[][]): T[];
    /**
     * Check if every tile in the grid is filled with a color other than gray.
     *
     * @returns True if every tile is filled with a color other than gray, false otherwise.
     */
    isComplete(): boolean;
    /**
     * Iterate over all tiles in the grid.
     * The iteration stops when the callback returns a value that is not undefined.
     *
     * @param callback The callback to call for each tile.
     * @returns The value returned by the callback that stopped the iteration, or undefined if the iteration completed.
     */
    forEach<T>(callback: (tile: TileData, x: number, y: number) => T | undefined): T | undefined;
    /**
     * Flood fill a continuous region starting from the given position with the given color.
     *
     * @param position The position to start the flood fill from.
     * @param from The color of the tiles to fill.
     * @param to The color to fill the tiles with.
     * @param allowFixed Whether to fill fixed tiles.
     * @returns The new grid with the region filled with the new color.
     */
    floodFill(position: Position_2, from: Color, to: Color, allowFixed: boolean): GridData;
    /**
     * Flood fill all tiles with the given color to a new color, even if they are not connected.
     *
     * @param from The color of the tiles to fill.
     * @param to The color to fill the tiles with.
     * @param allowFixed Whether to fill fixed tiles.
     * @returns The new grid with all tiles filled with the new color.
     */
    floodFillAll(from: Color, to: Color, allowFixed: boolean): GridData;
    /**
     * Check if the grid has any instructions that require a custom solution.
     * @returns True if the grid has any instructions that require a custom solution, false otherwise.
     */
    requireSolution(): boolean;
    /**
     * Reset all non-fixed tiles to gray.
     *
     * @returns The new grid with all non-fixed tiles reset to gray.
     */
    resetTiles(): this;
    /**
     * Copy the tiles in the given region to a new grid.
     * All connections and symbols within the selected region are copied.
     * All rules are included as well.
     *
     * @param origin The top-left corner of the region to copy.
     * @param width The width of the region to copy.
     * @param height The height of the region to copy.
     * @returns The new grid with the copied tiles.
     */
    copyTiles(origin: Position_2, width: number, height: number): GridData;
    /**
     * Paste the tiles from the given grid to the current grid at the given position.
     * All connections, symbols, and rules are merged.
     *
     * @param origin The top-left corner of the region to paste the tiles to.
     * @param grid The grid to paste the tiles from.
     * @returns The new grid with the pasted tiles.
     */
    pasteTiles(origin: Position_2, grid: GridData): GridData;
    /**
     * Paste the tiles from the given array to the current grid at the given position.
     *
     * @param origin The top-left corner of the region to paste the tiles to.
     * @param tile The array of tiles to paste.
     * @returns The new grid with the pasted tiles.
     */
    pasteTiles(origin: Position_2, tile: readonly (readonly TileData[])[]): GridData;
    /**
     * Check if this grid is equal to another grid in terms of size and tile colors.
     * Rules, symbols, and connections are not compared.
     *
     * @param grid The grid to compare with.
     * @returns True if the grids are equal in size and tile colors, false otherwise.
     */
    colorEquals(grid: GridData): boolean;
    /**
     * Check if this grid is equal to another grid in terms of size, tile colors, connections, symbols, and rules.
     *
     * @param other The grid to compare with.
     * @returns True if the grids are equal, false otherwise.
     */
    equals(other: GridData): boolean;
    /**
     * Get the count of tiles that satisfy the given conditions.
     * @param exists Whether the tile exists or not.
     * @param fixed Whether the tile is fixed or not. If undefined, the fixed state is ignored.
     * @param color The color of the tile. If undefined, all colors are included.
     * @returns The count of tiles that satisfy the given conditions.
     */
    getTileCount(exists: boolean, fixed?: boolean, color?: Color): number;
    /**
     * Get the count of tiles that satisfy the given conditions for each color.
     * @param color The color of the tiles.
     * @returns The count of tiles that satisfy the given conditions for each color.
     */
    getColorCount(color: Color): {
        min: number;
        max: number;
    };
    /**
     * Deduplicate the rules in the given list.
     *
     * @param rules The list of rules to deduplicate.
     * @returns The deduplicated list of rules.
     */
    static deduplicateRules(rules: readonly Rule[]): Rule[];
    /**
     * Deduplicate the singleton rules in the given list.
     *
     * @param rules The list of rules to deduplicate.
     * @returns The deduplicated list of rules.
     */
    static deduplicateSingletonRules(rules: readonly Rule[]): Rule[];
    /**
     * Deduplicate the symbols in the given map.
     *
     * @param symbols The map of symbols to deduplicate.
     * @returns The deduplicated map of symbols.
     */
    static deduplicateSymbols(symbols: ReadonlyMap<string, readonly _Symbol[]>): Map<string, _Symbol[]>;
}

declare interface GridResizeHandler {
    /**
     * Update itself when the grid is resized.
     */
    onGridResize(grid: GridData, mode: 'insert' | 'remove', direction: 'row' | 'column', index: number): this | null;
}

declare interface GridState {
    final: State;
    rules: readonly RuleState[];
    symbols: ReadonlyMap<string, State[]>;
}

declare function gridToJson(grid: GridData): PuzzleData_2;

declare class GridValidator {
    private worker;
    private stateListeners;
    private loadListeners;
    private readonly validateGridDebounced;
    readonly validateGrid: (grid: GridData, solution: GridData | null) => void;
    private readonly notifyState;
    readonly subscribeToState: (listener: (state: GridState) => void) => () => void;
    private readonly notifyLoad;
    readonly subscribeToLoad: (listener: () => void) => () => void;
    readonly isLoading: () => boolean;
    readonly delete: () => void;
}

declare class GridZones {
    readonly edges: readonly Edge[];
    constructor(edges?: readonly Edge[]);
    addEdge(edge: Edge): GridZones;
    removeEdge(edge: Edge): GridZones;
    hasEdge(edge: Edge): boolean;
    getEdgesAt({ x, y }: Position_2): readonly Edge[];
    /**
     * Check if two GridZones objects are equal.
     * @param other The other GridZones object to compare to.
     * @returns Whether the two objects are equal.
     */
    equals(other: GridZones): boolean;
    /**
     * Deduplicate an array of edges.
     * @param edges The array of edges to deduplicate.
     * @returns The deduplicated array of edges.
     */
    static deduplicateEdges(edges: readonly Edge[]): readonly Edge[];
    static validateEdges(connections: GridZones, width: number, height: number): GridZones;
    insertColumn(index: number): GridZones;
    insertRow(index: number): GridZones;
    removeColumn(index: number): GridZones;
    removeRow(index: number): GridZones;
}

declare class GzipCompressor extends StreamCompressor {
    get id(): string;
    protected get algorithm(): CompressionFormat;
}

declare function handlesFinalValidation<T extends Instruction>(val: T): val is T & FinalValidationHandler;

declare function handlesGetTile<T extends Instruction>(val: T): val is T & GetTileHandler;

declare function handlesGridChange<T extends Instruction>(val: T): val is T & GridChangeHandler;

declare function handlesGridResize<T extends Instruction>(val: T): val is T & GridResizeHandler;

declare function handlesSetGrid<T extends Instruction>(val: T): val is T & SetGridHandler;

declare function handlesSymbolDisplay<T extends Instruction>(val: T): val is T & SymbolDisplayHandler;

declare function handlesSymbolMerge<T extends Instruction>(val: T): val is T & SymbolMergeHandler;

declare function handlesSymbolValidation<T extends Rule>(val: T): val is T & SymbolValidationHandler;

declare class HiddenSymbol extends _Symbol implements SymbolDisplayHandler {
    readonly x: number;
    readonly y: number;
    readonly revealLocation: boolean;
    readonly title = "Hidden Symbol Marker";
    get configExplanation(): string;
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Hidden Symbols: color cells correctly to reveal more clues**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param revealLocation - Whether to reveal the location of the symbol.
     */
    constructor(x: number, y: number, revealLocation?: boolean);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get necessaryForCompletion(): boolean;
    get visibleWhenSolving(): boolean;
    get sortOrder(): number;
    validateSymbol(grid: GridData, solution: GridData | null): State;
    onSymbolDisplay(grid: GridData, solution: GridData | null, symbol: _Symbol, editing: boolean): boolean;
    copyWith({ x, y, revealLocation, }: {
        x?: number;
        y?: number;
        revealLocation?: boolean;
    }): this;
    withRevealLocation(revealLocation: boolean): this;
}

declare class HouseSymbol extends NumberSymbol {
    readonly x: number;
    readonly y: number;
    readonly number: number;
    readonly title = "House";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Houses must connect to exactly one other house**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param number - The number of houses in this region.
     */
    constructor(x: number, y: number, number: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    } | null;
    copyWith({ x, y, number, }: {
        x?: number;
        y?: number;
        number?: number;
    }): this;
}

declare interface IconConfig extends Config<string> {
    readonly type: ConfigType.Icon;
}

declare const IDENTITY: Symmetry;

/**
 * Colors a gray cell when one of its hypothetical colors would leave the region containing it
 * with no satisfiable size. Sizes come from the region size store, so both area number symbols
 * and region area size rules are covered:
 *
 * - Every gray cell holding an area number symbol is tested in both colors.
 * - Every other gray merged tile is tested in each color that could matter: a color bounded by a
 *   region area size rule, or a color that would merge the tile into a size-constrained region.
 */
declare class ImpossibleRegionColor extends InsightLemma {
    readonly id = "impossible-region-color";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private checks;
    /**
     * Whether hypothesizing the given tiles as `color` could produce a size contradiction: the
     * color must be bounded by a region area size rule, or the tiles must touch a region that
     * already has size possibilities and could absorb them.
     */
    private colorMatters;
    private impossibleColor;
}

/**
 * Colors a gray cell against a color that would leave an area unable to meet a symbols-per-area
 * minimum. If filling the cell with color C (taking merged tiles as atomic) can reach, across the
 * whole C-or-gray area it would belong to, fewer `necessaryForCompletion` symbols than an
 * `exactly`/`at least` rule demands, then C is impossible there and the cell must be the opposite
 * color. When both colors are impossible the grid is in an invalid state.
 *
 * Reachable symbols are counted optimistically (every gray cell on the flood is assumed to take
 * color C), so a shortfall is a genuine contradiction rather than a missing later deduction.
 */
declare class ImpossibleSymbolAreaColor extends InsightLemma {
    readonly id = "impossible-symbol-area-color";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * Central mutable state for insight solving.
 */
declare class InsightContext {
    private _grid;
    tileHistory: TileChange[];
    constructor(grid: GridData);
    /**
     * Current grid state observed by lemmas and stores.
     */
    get grid(): GridData;
    /**
     * Updates grid colors and notifies all initialized stores.
     */
    setTiles(newTiles: readonly (readonly TileData[])[], proof?: Proof): void;
    copy(): InsightContext;
    private _regionSizes?;
    get regionSizes(): Readonly<RegionSizeStore>;
    private _numbers?;
    get numbers(): Readonly<NumberSymbolStore>;
    private _areas?;
    get areas(): Readonly<AreaStore>;
    private _regions?;
    get regions(): Readonly<RegionStore>;
}

declare class InsightError extends Error {
    /**
     * The ID of the source that caused the error.
     */
    readonly source: string;
    constructor(
    /**
     * The ID of the source that caused the error.
     */
    source: string, message: string);
}

declare abstract class InsightLemma {
    abstract get id(): string;
    abstract isApplicable(grid: GridData): boolean;
    abstract apply(context: InsightContext): boolean;
    protected proof(): Proof;
    protected error(message: string): InsightError;
}

declare class InsightSolver extends Solver {
    readonly id = "insight";
    readonly author = "romain22222, Lysine";
    readonly supportsCancellation = true;
    readonly description = "An insight-driven solver that outputs logical deductions and difficulty rating as it solves the puzzle.";
    protected createWorker(): Worker;
    protected isEnvironmentSupported(): Promise<boolean>;
    solve(grid: GridData, abortSignal?: AbortSignal): AsyncGenerator<GridData | null>;
    process(grid: GridData, options: {
        completeSolve: boolean;
        reportProof: boolean;
        onProgress?: (progress: number, total: number) => void;
        abortSignal?: AbortSignal;
    }): Promise<{
        grid: GridData | null | undefined;
        proofs?: ProofNode[];
    } | Error>;
}

/**
 * Base class for all insight context stores.
 */
declare abstract class InsightStore {
    protected readonly context: InsightContext;
    protected constructor(context: InsightContext);
    abstract get id(): string;
    /**
     * Refresh internal deductions after the context grid colors changed.
     */
    abstract onGridUpdate(): void;
    abstract copyWithContext(context: InsightContext): this;
    protected error(message: string): InsightError;
}

declare abstract class Instruction extends Configurable {
    abstract get id(): string;
    abstract get explanation(): string;
    get configExplanation(): string;
    abstract createExampleGrid(): GridData;
    /**
     * Indicates that validation by logic is not available and the solution must be used for validation
     */
    get validateWithSolution(): boolean;
    get necessaryForCompletion(): boolean;
    get visibleWhenSolving(): boolean;
    /**
     * Return a variant of this instruction that is suitable for the given mode.
     */
    abstract modeVariant(mode: Mode): Instruction | null;
    /**
     * Check if this instruction is equal to another instruction by comparing their IDs and configs.
     *
     * @param other The other instruction to compare to.
     * @returns Whether the two instructions are equal.
     */
    equals(other: Instruction): boolean;
}

declare enum Instrument {
    Piano = "piano",
    Drum = "drum",
    Violin = "violin",
    Xylophone = "xylophone",
    GuitarAcoustic = "guitar-acoustic",
    GuitarElectric = "guitar-electric",
    Flute = "flute",
    Trumpet = "trumpet"
}

declare const INSTRUMENTS: readonly Instrument[];

declare class IntArray2D {
    private readonly array;
    readonly width: number;
    readonly height: number;
    private constructor();
    static create(width: number, height: number): IntArray2D;
    set(x: number, y: number, value: number): void;
    get(x: number, y: number): number;
    clone(): IntArray2D;
}

declare function invokeSetGrid(oldGrid: GridData, newGrid: GridData, solution: GridData | null): GridData;

/** True when the symmetry maps every cell center to a cell center. */
declare function isCellPreserving(symmetry: Symmetry): boolean;

declare function isDrumSample(note: string): boolean;

declare function isEventHandler<T>(val: unknown, event: string): val is T;

/**
 * Check if two edges are the same, regardless of direction.
 * @param a The first edge.
 * @param b The second edge.
 * @returns Whether the edges are the same.
 */
declare function isSameEdge(a: Edge, b: Edge): boolean;

/** True when the symmetry is a non-zero translation, which no finite region can absorb. */
declare function isTranslation(symmetry: Symmetry): boolean;

declare interface LemmaLoopHooks {
    /** Called at the start of each full pass over the lemma list. */
    onPassStart?: () => void;
    /** Called before each lemma attempt with its index in the list. */
    onLemmaStart?: (index: number) => void;
    /**
     * Called when a lemma made progress, with the tile history entries it added.
     * Return `false` to stop the loop entirely instead of restarting from the first lemma.
     */
    onLemmaSuccess?: (lemma: InsightLemma, newHistory: readonly TileChange[]) => boolean | void;
    /** Called when a lemma made no progress. */
    onLemmaNoChange?: (lemma: InsightLemma) => void;
}

declare class LetterBTModule extends BTModule {
    private letters;
    private letterGrid;
    constructor(instrs: LetterSymbol[], width: number, height: number);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private visitArea;
}

declare class LetterSymbol extends _Symbol {
    readonly x: number;
    readonly y: number;
    readonly letter: string;
    readonly title = "Letter";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Letters must be sorted into one type per area**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param letter - The letter of the symbol.
     */
    constructor(x: number, y: number, letter: string);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(grid: GridData): State;
    copyWith({ x, y, letter, }: {
        x?: number;
        y?: number;
        letter?: string;
    }): this;
    withLetter(letter: string): this;
}

declare function linearKey(symmetry: Symmetry): string;

declare class LotusBTModule extends DirectionLinkerBTModule {
    instr: LotusSymbol;
    constructor(instr: LotusSymbol);
    protected movePos(grid: BTGridData, x: number, y: number): Position_2 | null;
    private getTileSafe;
    checkGlobal(grid: BTGridData): false | CheckResult;
}

declare class LotusSymbol extends DirectionLinkerSymbol {
    readonly x: number;
    readonly y: number;
    readonly orientation: Orientation;
    readonly title = "Lotus";
    private static readonly linkedDirectionsFromOrientation;
    /**
     * **Areas containing this symbol must be symmetrical**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param orientation - The orientation of the symbol.
     */
    constructor(x: number, y: number, orientation: Orientation);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(grid: GridData): State;
    copyWith({ x, y, orientation, }: {
        x?: number;
        y?: number;
        orientation?: Orientation;
    }): this;
}

declare class LyingSymbolRule extends Rule implements FinalValidationHandler {
    readonly count: number;
    readonly title = "Lying Symbols";
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    /**
     * **&lt;count&gt; symbols are lying and are incorrect**
     *
     * @param count Number of lying symbols
     */
    constructor(count: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_: GridData): RuleState;
    get isSingleton(): boolean;
    onFinalValidation(grid: GridData, solution: GridData | null, state: GridState): GridState;
    copyWith({ count }: {
        count?: number;
    }): this;
    withCount(count: number): this;
}

/**
 * Major rules are frequently referenced in grids to provide additional UI.
 */
declare enum MajorRule {
    MusicGrid = "music",
    CompletePattern = "complete_pattern",
    Underclued = "underclued",
    WrapAround = "wrap_around"
}

/**
 * The master compressor for compressing and decompressing strings.
 *
 * It compares the output of multiple compressors and selects the one with the smallest size (slow),
 * and selects the correct decompressor when decompressing.
 */
declare class MasterCompressor extends CompressorBase {
    get id(): string;
    compress(input: string): Promise<string>;
    decompress(input: string): Promise<string>;
}

/**
 * Return the first element of the array which has the maximum mapped value.
 *
 * @param values The array of values.
 * @param mapper The function to map each value to a number.
 * @returns The first element with the maximum mapped value.
 */
declare function maxBy<T>(values: readonly T[], mapper: (element: T) => number): T | undefined;

declare const MetadataSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodString;
    description: z.ZodString;
    difficulty: z.ZodNumber;
}, z.core.$strict>;

/**
 * Return the first element of the array which has the minimum mapped value.
 *
 * @param values The array of values.
 * @param mapper The function to map each value to a number.
 * @returns The first element with the minimum mapped value.
 */
declare function minBy<T>(values: readonly T[], mapper: (element: T) => number): T | undefined;

declare class MinesweeperBTModule extends BTModule {
    instr: MinesweeperSymbol;
    private cachedCheckResult?;
    constructor(instr: MinesweeperSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private buildCheckAndRating;
}

declare class MinesweeperSymbol extends NumberSymbol {
    readonly title = "Minesweeper Number";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Minesweeper Numbers count opposite cells in 8 adjacent spaces**
     *
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param number - The number of cells seen by the symbol.
     */
    constructor(x: number, y: number, number: number);
    get id(): string;
    get placementStep(): number;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    private countForColor;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    };
    copyWith({ x, y, number, }: {
        x?: number;
        y?: number;
        number?: number;
    }): this;
    withNumber(number: number): this;
}

declare enum Mode {
    Create = "create",
    Solve = "solve",
    Perfection = "perfection"
}

declare function modifyTiles(grid: GridData, mapper?: (x: number, y: number, methods: TileMethods) => void): TileData[][];

/**
 * Offset the given position by a given step in the given direction.
 * @param position The position to offset.
 * @param direction The direction to offset in.
 * @param step The distance to offset by.
 * @returns The offset position.
 */
declare function move(position: Position_2, direction: Direction | Orientation, step?: number): {
    x: number;
    y: number;
};

declare class MusicGridRule extends Rule implements GridChangeHandler, SetGridHandler, GridResizeHandler {
    readonly controlLines: readonly ControlLine[];
    readonly track: GridData | null;
    readonly normalizeVelocity: boolean;
    readonly title = "Music Grid";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Music Grid: Listen to the solution**
     * @param controlLines Denote changes in the playback settings. At least one control line at column 0 should be present to enable playback.
     * @param track The grid to be played when "listen" is clicked. Set as null to play the solution.
     * @param normalizeVelocity Whether to normalize the velocity of the notes by their pitch such that lower notes are played softer.
     */
    constructor(controlLines: readonly ControlLine[], track: GridData | null, normalizeVelocity?: boolean);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_grid: GridData): RuleState;
    onSetGrid(_oldGrid: GridData, newGrid: GridData, _solution: GridData | null): GridData;
    onGridChange(newGrid: GridData): this;
    onGridResize(_grid: GridData, mode: 'insert' | 'remove', direction: 'row' | 'column', index: number): this | null;
    /**
     * Add or replace a control line.
     * @param controlLine The control line to set.
     * @returns A new rule with the control line set.
     */
    setControlLine(controlLine: ControlLine): this;
    withTrack(track: GridData | null): this;
    copyWith({ controlLines, track, normalizeVelocity, }: {
        controlLines?: readonly ControlLine[];
        track?: GridData | null;
        normalizeVelocity?: boolean;
    }): this;
    get validateWithSolution(): boolean;
    get isSingleton(): boolean;
    static mergeControlLines(...lines: ControlLine[]): ControlLine;
    static deduplicateControlLines(lines: readonly ControlLine[]): ControlLine[];
}

declare class MyopiaBTModule extends BTModule {
    instr: MyopiaSymbol;
    constructor(instr: MyopiaSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare class MyopiaSymbol extends _Symbol implements SymbolMergeHandler {
    readonly diagonals: boolean;
    readonly directions: OrientationToggle;
    get title(): "Framed Myopia Arrow" | "Myopia Arrow";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    private static readonly EXAMPLE_DIAGONAL_GRID;
    /**
     * **Viewpoint Numbers count visible cells in the four directions**
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param diagonals - Whether the symbol should consider diagonal directions.
     * @param directions - The directions in which an arrow is pointing.
     */
    constructor(x: number, y: number, diagonals: boolean, directions: OrientationToggle);
    get id(): string;
    get placementStep(): number;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(grid: GridData): State;
    descriptionEquals(other: _Symbol): boolean;
    copyWith({ x, y, diagonals, directions, }: {
        x?: number;
        y?: number;
        diagonals?: boolean;
        directions?: OrientationToggle;
    }): this;
    withDirections(directions: OrientationToggle): this;
    withDiagonals(diagonals: boolean): this;
}

declare class MysteryRule extends Rule implements FinalValidationHandler, GridChangeHandler, GridResizeHandler {
    readonly solution: GridData;
    readonly visible: boolean;
    readonly title = "Alternate Solution";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly CONFIGS;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Mystery: alternate solution**
     */
    constructor(solution: GridData, visible: boolean);
    get id(): string;
    get explanation(): string;
    get visibleWhenSolving(): boolean;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    get necessaryForCompletion(): boolean;
    onFinalValidation(grid: GridData, _solution: GridData | null, state: GridState): GridState;
    onGridChange(newGrid: GridData): this;
    onGridResize(_grid: GridData, mode: 'insert' | 'remove', direction: 'row' | 'column', index: number): this | null;
    copyWith({ solution, visible, }: {
        solution?: GridData;
        visible?: boolean;
    }): this;
    withSolution(solution: GridData): this;
    withVisible(visible: boolean): this;
    static cleanSolution(solution: GridData, baseGrid?: GridData): GridData;
}

declare const NEIGHBOR_OFFSETS: Position_2[];

declare const NEIGHBOR_OFFSETS_8: Position_2[];

declare type NodeId = number & {
    [graphSymbol]: 'node';
};

declare type NodePair = `${NodeId},${NodeId}`;

declare class NoLoopsRule extends Rule {
    readonly color: Color;
    readonly title = "No Loops";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **No loops in &lt;color&gt; cells**
     *
     * @param color - The color of the cells to check.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
    withColor(color: Color): this;
}

declare function normalizeShape(shape: Shape): Shape;

declare interface NullableBooleanConfig extends Config<boolean | null> {
    readonly type: ConfigType.NullableBoolean;
}

declare interface NullableGridConfig extends Config<GridData | null> {
    readonly type: ConfigType.NullableGrid;
    readonly nonNullDefault: GridData;
}

declare interface NullableInstrumentConfig extends Config<Instrument | null> {
    readonly type: ConfigType.NullableInstrument;
}

declare interface NullableNoteConfig extends Config<string | null> {
    readonly type: ConfigType.NullableNote;
}

declare interface NullableNumberConfig extends Config<number | null> {
    readonly type: ConfigType.NullableNumber;
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}

declare interface NumberConfig extends Config<number> {
    readonly type: ConfigType.Number;
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}

/**
 * All symbols which contain a number should extend this class to be compatible with off by X rules.
 */
declare abstract class NumberSymbol extends _Symbol {
    readonly x: number;
    readonly y: number;
    readonly number: number;
    constructor(x: number, y: number, number: number);
    abstract countTiles(grid: GridData): {
        completed: number;
        possible: number;
    } | null;
    validateSymbol(grid: GridData): State;
    withNumber(number: number): this;
}

/**
 * Tracks the possible values of each number symbol along with the proofs that eliminated specific
 * values.
 *
 * Without an off-by-X rule a symbol admits exactly its printed number, so the store mainly serves
 * as a place to record eliminations. With one, every symbol admits `n - x` and `n + x`, and lemmas
 * eliminate the candidates their counting rules cannot satisfy.
 *
 * Base candidates are derived on demand from the current grid, so they follow the printed number;
 * eliminations are recorded against the symbol object itself, whose identity is stable across grid
 * updates (only tiles change during a solve).
 *
 * Feasibility against a symbol's own count (what it has already seen versus what it could still
 * see) is deliberately left to the lemmas: they own the counting rules and therefore produce the
 * precise contradiction messages. Callers eliminate values through
 * {@link NumberSymbolStore.eliminatePossibility}.
 */
declare class NumberSymbolStore extends InsightStore {
    private eliminations;
    private offByX;
    readonly id = "number-symbol";
    constructor(context: InsightContext);
    onGridUpdate(): void;
    copyWithContext(context: InsightContext): this;
    /**
     * Returns the values the given number symbol could still hold, or null if it has no printed
     * number to constrain.
     *
     * When a proof is given, the deductions that eliminated other values for this symbol are added
     * to it as supporting evidence.
     */
    getPossibilities(symbol: NumberSymbol, proof?: Proof): number[] | null;
    /**
     * Returns the smallest value the symbol could still hold and contributes supporting proof.
     */
    minPossible(symbol: NumberSymbol, proof?: Proof): number;
    /**
     * Returns the largest value the symbol could still hold and contributes supporting proof.
     */
    maxPossible(symbol: NumberSymbol, proof?: Proof): number;
    /**
     * Eliminates one possible value of a number symbol. Returns true if the value was successfully
     * eliminated.
     */
    eliminatePossibility(symbol: NumberSymbol, possibility: number, deduction: Proof): boolean;
    /**
     * The values the printed number admits before any elimination: exactly the number, or the two
     * numbers `n ± x` when an off-by-X rule is present, clamped to a range a count can physically
     * reach.
     */
    private basePossibilities;
}

declare class OffByXAreaNumberConstrainedByRegionSize extends InsightLemma {
    readonly id = "off-by-x-area-number-constrained-by-region-size";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare class OffByXRule extends Rule implements SymbolValidationHandler {
    readonly number: number;
    readonly title = "Off By X";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    private static readonly SEARCH_VARIANTS;
    /**
     * **All numbers are off by &lt;number&gt;**
     *
     * @param number - The number that all cells are off by.
     */
    constructor(number: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    onSymbolValidation(grid: GridData, symbol: _Symbol, _validator: (grid: GridData) => State): State | undefined;
    get isSingleton(): boolean;
    copyWith({ number }: {
        number?: number;
    }): this;
    withNumber(number: number): this;
}

declare const OFFSETS: {
    x: number;
    y: number;
}[];

declare enum Orientation {
    Up = "up",
    UpRight = "up-right",
    Right = "right",
    DownRight = "down-right",
    Down = "down",
    DownLeft = "down-left",
    Left = "left",
    UpLeft = "up-left"
}

declare const orientationChars: {
    up: string;
    "up-right": string;
    right: string;
    "down-right": string;
    down: string;
    "down-left": string;
    left: string;
    "up-left": string;
};

declare interface OrientationConfig extends Config<Orientation> {
    readonly type: ConfigType.Orientation;
}

declare type OrientationMap<T> = Record<Orientation, T>;

declare const ORIENTATIONS: readonly Orientation[];

declare type OrientationToggle = Readonly<OrientationMap<boolean>>;

declare function orientationToggle(...orientations: readonly Orientation[]): {
    up: boolean;
    'up-right': boolean;
    right: boolean;
    'down-right': boolean;
    down: boolean;
    'down-left': boolean;
    left: boolean;
    'up-left': boolean;
};

declare interface OrientationToggleConfig extends Config<OrientationToggle> {
    readonly type: ConfigType.OrientationToggle;
}

/**
 * Convert the given orientation to a rotation in degrees.
 * @param orientation The orientation to convert.
 * @returns The rotation in degrees.
 */
declare function orientationToRotation(orientation: Orientation): 0 | 45 | 90 | 125 | 180 | 225 | 270 | 315;

/** Renders a candidate list as `3` or `1 or 3`, for proofs that admit several values. */
declare function orList(values: readonly number[]): string;

declare class PerfectionRule extends Rule implements SetGridHandler, FinalValidationHandler {
    readonly editor: boolean;
    readonly title = "Perfection";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Quest for Perfection: cell colors are final**
     *
     * @param editor - whether to enable editor mode. This field is automatically set by the editor.
     */
    constructor(editor?: boolean);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    get necessaryForCompletion(): boolean;
    get isSingleton(): boolean;
    modeVariant(mode: Mode): Rule | null;
    validateGrid(grid: GridData): RuleState;
    /**
     * If the grid passes validation but is different from the solution, indicate the error in the final state.
     */
    onFinalValidation(grid: GridData, solution: GridData | null, state: GridState): GridState;
    private fixTiles;
    private isValid;
    private findSingleError;
    /**
     * Force all tiles to be fixed.
     *
     * If the grid is already wrong, prevent the player from changing it further.
     */
    onSetGrid(oldGrid: GridData, newGrid: GridData, solution: GridData | null): GridData;
    copyWith({ editor }: {
        editor?: boolean;
    }): this;
}

declare interface Position_2 {
    readonly x: number;
    readonly y: number;
}

declare function positionsToShape(positions: Position_2[], color: Color): Shape;

declare const positionSymbol: unique symbol;

declare type PositionValue = number & {
    [positionSymbol]: 'position';
};

declare class Proof {
    readonly root: ProofNode;
    protected constructor(root: ProofNode);
    static create(source: string): Proof;
    difficulty(level: number): this;
    describe(description: string): this;
    add(deduction: Proof): this;
    copy(): Proof;
    private nodeToString;
    toString(): string;
}

declare interface ProofNode {
    source: string;
    description: string;
    difficulty: number;
    children: Set<ProofNode>;
}

declare type Puzzle = PuzzleMetadata & PuzzleData;

declare interface PuzzleChecklist {
    items: PuzzleChecklistItem[];
    isValid: boolean;
}

declare interface PuzzleChecklistItem {
    id: string;
    success: boolean;
    mandatory: boolean;
}

declare type PuzzleData = {
    /**
     * The grid of the puzzle. (required)
     *
     * You must fix all given cells in the grid. The rest of the cells will be cleared.
     */
    grid: GridData;
    /**
     * The solution to the puzzle. (optional)
     *
     * You should provide a solution if a rule requires it. Otherwise, the rule can never be satisfied.
     *
     * If there are no rules that require a solution, this field will be ignored.
     */
    solution: GridData | null;
};

/**
 * Checks if two puzzles are equal.
 */
declare function puzzleEquals(a: Puzzle, b: Puzzle): boolean;

declare type PuzzleMetadata = {
    /**
     * The title of the puzzle. (required)
     */
    title: string;
    /**
     * The author of the puzzle. (required)
     */
    author: string;
    /**
     * A description of the puzzle. (can be empty)
     */
    description: string;
    /**
     * The difficulty of the puzzle, from 0 to 10. (required)
     *
     * 0 represents an unrated puzzle, 6-10 represent star difficulties.
     */
    difficulty: number;
};

declare const PuzzleSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodString;
    description: z.ZodString;
    difficulty: z.ZodNumber;
    grid: z.ZodCustom<GridData, GridData>;
    solution: z.ZodNullable<z.ZodCustom<GridData, GridData>>;
}, z.core.$strict>;

/**
 * General puzzle types for categorization. One puzzle can have multiple types.
 */
declare enum PuzzleType {
    Logic = "logic",
    Underclued = "underclued",
    Pattern = "pattern",
    Music = "music"
}

declare interface Rating {
    pos: Position_2;
    score: number;
}

declare class Region {
    protected readonly context: InsightContext;
    readonly id: RegionId;
    color: Color;
    positions: Position_2[];
    symbols: Set<_Symbol>;
    connectedAreas: Set<AreaId>;
    connectionProofs: Set<Proof>;
    disconnectionProofs: Set<Proof>;
    constructor(context: InsightContext, id: RegionId, color: Color, positions?: Position_2[], symbols?: Set<_Symbol>, connectedAreas?: Set<AreaId>, connectionProofs?: Set<Proof>, disconnectionProofs?: Set<Proof>);
    static merge(regionA: Region, regionB: Region, id: RegionId, proof?: Proof): Region;
    private _regionMap?;
    private mapVersion;
    /**
     * Get a map of cells that are in the same region as the given cell (`true`), in a different
     * region (`false`), or unknown but possible (`null`). Includes deductions from lemmas.
     *
     * Use {@link RegionStore.explainRegion} to attribute the proofs backing this region to a proof.
     */
    getRegionMap(): RegionMap;
    private buildRegionMap;
    private _regionGraph?;
    private graphVersion;
    /**
     * Get a graph representation of the region map for related computations.
     *
     * Use {@link RegionStore.explainRegion} to attribute the proofs backing this region to a proof.
     */
    getRegionGraph(): RegionGraph;
    private buildRegionGraph;
}

declare class RegionAreaBTModule extends BTModule {
    instr: RegionAreaRule;
    constructor(instr: RegionAreaRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private visitArea;
}

declare class RegionAreaRule extends Rule {
    readonly color: Color;
    readonly size: number;
    readonly title = "Region Area Size";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_GRAY;
    private static readonly SEARCH_VARIANTS;
    /**
     * **All &lt;color&gt; regions have area &lt;size&gt;**
     *
     * @param color - The color of the regions.
     * @param size - The area of the regions.
     */
    constructor(color: Color, size: number);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color, size }: {
        color?: Color;
        size?: number;
    }): this;
    withColor(color: Color): this;
    withSize(size: number): this;
}

declare class RegionGraph {
    protected readonly grid: GridData;
    /**
     * Each node gets an auto-incremented id. This map stores the grid positions corresponding to each node id.
     * There can be multiple positions associated with one node because of merged tiles.
     */
    idToPositions: Map<NodeId, PositionValue[]>;
    /**
     * Each node gets an auto-incremented id. This map stores the node id corresponding to each grid position.
     */
    positionToId: Map<PositionValue, NodeId>;
    /**
     * Adjacency list representing the graph structure. Each node id maps to a set of adjacent node ids.
     */
    adjacency: Map<NodeId, Set<NodeId>>;
    private _articulationPoints?;
    private _shortestPaths;
    /**
     * Articulation points are nodes that, if removed, would increase the number of connected components in the graph.
     * In the context of the puzzle, these represent chokepoints between different regions where connections must pass through.
     */
    get articulationPoints(): Set<NodeId>;
    constructor(grid: GridData);
    createNode(): NodeId;
    addToNode(id: NodeId, x: number, y: number): void;
    getId(x: number, y: number): NodeId;
    getPositions(id: NodeId): Position_2[];
    connect(x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Find the shortest path between two nodes using the A* algorithm. The heuristic used is the Manhattan distance
     * between the positions of the nodes.
     */
    shortestPath(id1: NodeId, id2: NodeId): NodeId[];
    private tarjanAlgorithm;
    private aStar;
    private nodeWeight;
    private heuristic;
    toPositionValue(x: number, y: number): PositionValue;
    toPosition(positionValue: PositionValue): Position_2;
    toNodePair(valueA: NodeId, valueB: NodeId): NodePair;
}

declare type RegionId = AreaId & {
    [regionSymbol]: 'region';
};

declare type RegionMap = (boolean | null)[][];

declare type RegionPair = `${RegionId},${RegionId}`;

declare abstract class RegionShapeBTModule extends BTModule {
    instr: RegionShapeRule;
    constructor(instr: RegionShapeRule);
    protected getShapeRegions(grid: BTGridData): ShapeRegions['regions'];
    private visitArea;
}

declare abstract class RegionShapeRule extends Rule {
    readonly color: Color;
    /**
     * @param color - The color of the regions to compare.
     */
    constructor(color: Color);
    protected getShapeRegions(grid: GridData): ShapeRegions;
    withColor(color: Color): this;
}

/**
 * Tracks the possible sizes of regions based on the area number symbols they contain and the
 * region area size rules that apply to their color, along with the proofs that eliminated specific
 * sizes.
 *
 * Base possibilities are derived on demand from the current region (its area number symbols,
 * including both `n±x` values when an off-by-X rule is present, intersected with the size of any
 * region area size rule matching the region's color), so they automatically follow region merges
 * and grid updates. Eliminations are recorded against the region's ID at the time of the deduction
 * and are re-resolved through the region store on every query, so they propagate to any region
 * that later absorbs the tracked cells.
 */
declare class RegionSizeStore extends InsightStore {
    private eliminations;
    private offByX;
    private regionArea;
    readonly id = "region-size";
    constructor(context: InsightContext);
    onGridUpdate(): void;
    copyWithContext(context: InsightContext): this;
    /**
     * Returns the possible sizes of the given region, or null if the region's size is not
     * constrained by any area number symbol.
     *
     * When a proof is given, all deductions that eliminated other sizes for this region are added
     * to it as supporting evidence.
     */
    getPossibilities(region: Region, proof?: Proof): number[] | null;
    /**
     * Returns the minimum possible size of the region and contributes supporting proof.
     */
    minPossible(region: Region, proof?: Proof): number;
    /**
     * Returns the maximum possible size of the region and contributes supporting proof.
     */
    maxPossible(region: Region, proof?: Proof): number;
    /**
     * Eliminates one possible size for a region. Returns true if the possibility was successfully
     * eliminated.
     *
     * The elimination follows the tracked cells: if their region is later merged into a larger one,
     * the larger region inherits the elimination.
     */
    eliminatePossibility(region: Region, possibility: number, deduction: Proof): boolean;
    /**
     * Computes the base possible sizes of a region from the area number symbols it contains and the
     * region area size rules that apply to its color, or null if the region has no size constraint.
     */
    private basePossibilities;
    /**
     * Collects all eliminations recorded against regions whose cells are now part of the given region.
     */
    private collectDeductions;
}

/**
 * Tracks the formation of regions by connecting areas together based on logical deductions.
 *
 * Note on terminology:
 * - **Areas** refer to a group of orthogonally same-color non-gray tiles on the grid. Each area has a unique ID and
 * an associated `Area` object in `AreaInfoStore`.
 * - **Regions** refer to a group of connected areas based on logical deductions. Each region is represented by the ID
 * of the representative area. The representative area is determined by the `disjointSet` in this store.
 */
declare class RegionStore extends InsightStore {
    /**
     * Tracks which **areas** are connected into regions based on logical deductions. Each region is represented by the ID
     * of the representative area in `AreaInfoStore`.
     */
    private disjointSet;
    /**
     * Connections between **areas** represented by area ID pairs.
     * This must not include entries connecting two cells in the same area, aka redundant connections.
     */
    private connectionProofs;
    /**
     * Deductions that two **regions** are disconnected, keyed by representative area ID pairs.
     */
    private disconnectionProofs;
    /**
     * Stores physical disconnections between two **regions**, keyed by representative area ID pairs.
     */
    private physicalDisconnections;
    /**
     * Stores all regions.
     */
    private _regions;
    readonly id = "region";
    /**
     * Bumped whenever the connectivity of the store changes, so that the derived maps and graphs
     * cached on the {@link Region} objects can be invalidated.
     */
    version: number;
    constructor(context: InsightContext, initialize?: boolean);
    get regions(): ReadonlyMap<RegionId, Region>;
    get(position: Position_2 | PositionValue): Region | null;
    getByColor(color: Color): Region[];
    /**
     * Recompute all connectivity information based on the current grid state.
     */
    onGridUpdate(): void;
    copyWithContext(context: InsightContext): this;
    /**
     * Checks whether two cells are connected, including lemma deductions.
     */
    isConnected(cellA: Position_2, cellB: Position_2, proof?: Proof): boolean;
    /**
     * Checks whether two cells are disconnected, including lemma deductions.
     */
    isDisconnected(cellA: Position_2, cellB: Position_2, proof?: Proof): boolean;
    /**
     * Gets the list of regions that are disconnected from the given cell.
     */
    getDisconnectedRegions(cell: Position_2, proof?: Proof): ReadonlySet<RegionId>;
    /**
     * Adds the proofs backing the given region to the proof: all connection proofs, plus disconnection proofs.
     * Pass `scope` to limit disconnection proofs to those whose other region has cells near the given positions.
     * Proofs are human-readable, so proximity is used as a heuristic for relevance instead of exact
     * dependency tracking. Callers should pass the positions their deduction actually reasoned about
     * (e.g. the path and chokepoints for a bottleneck lemma, or the region's own cells).
     */
    explainRegion(region: Region, proof: Proof, scope?: readonly Position_2[]): void;
    /**
     * Records a logical connection between two regions. Returns true if the connection was successfully recorded.
     */
    addConnected(cellA: Position_2, cellB: Position_2, proof: Proof): boolean;
    /**
     * Records a logical disconnection between two regions. Returns true if the disconnection was successfully recorded.
     */
    addDisconnected(cellA: Position_2, cellB: Position_2, proof: Proof): boolean;
    private recompute;
    private rekeyConnectionProofs;
    private rekeyDisconnectionProofs;
    private buildPhysicalDisconnections;
    toPositionValue(x: number, y: number): PositionValue;
    toPosition(positionValue: PositionValue): Position_2;
    toAreaPair(valueA: AreaId, valueB: AreaId): AreaPair;
    fromAreaPair(key: AreaPair): [AreaId, AreaId];
    toRegionPair(valueA: RegionId, valueB: RegionId): RegionPair;
    fromRegionPair(key: RegionPair): [RegionId, RegionId];
}

declare const regionSymbol: unique symbol;

/**
 * Resize the given array to the new size, cutting off or padding with the default value.
 * @param array The array to resize.
 * @param newSize The new size of the array.
 * @param defaultValue A function that returns the default value for each new element.
 * @returns The resized array.
 */
declare function resize<T>(array: T[], newSize: number, defaultValue: () => T): T[];

declare function resize<T>(array: readonly T[], newSize: number, defaultValue: () => T): readonly T[];

declare class Row extends Configurable {
    /**
     * The note to play at this row, or null to keep the current note from the previous control line.
     * If this is null from the first control line, the note will be silent.
     */
    readonly note: string | null;
    /**
     * The instrument to play the note with, or null to keep the current instrument from the previous control line.
     * If this is null from the first control line, the instrument will be "piano".
     * This has no effect if the current note is a drum sample.
     */
    readonly instrument: Instrument | null;
    /**
     * The velocity to play the note at, or null to keep the current velocity from the previous control line.
     * Ranges from 0 to 1
     */
    readonly velocity: number | null;
    readonly title = "Music Grid - Row";
    readonly configExplanation = "Configure the playback settings from this tile onwards.";
    private static readonly CONFIGS;
    constructor(
    /**
     * The note to play at this row, or null to keep the current note from the previous control line.
     * If this is null from the first control line, the note will be silent.
     */
    note: string | null, 
    /**
     * The instrument to play the note with, or null to keep the current instrument from the previous control line.
     * If this is null from the first control line, the instrument will be "piano".
     * This has no effect if the current note is a drum sample.
     */
    instrument: Instrument | null, 
    /**
     * The velocity to play the note at, or null to keep the current velocity from the previous control line.
     * Ranges from 0 to 1
     */
    velocity: number | null);
    get configs(): readonly AnyConfig[] | null;
    copyWith({ note, instrument, velocity, }: {
        note?: string | null;
        instrument?: Instrument | null;
        velocity?: number | null;
    }): this;
}

declare abstract class Rule extends Instruction {
    abstract validateGrid(grid: GridData): RuleState;
    abstract get searchVariants(): SearchVariant[];
    searchVariant(): SearchVariant;
    modeVariant(_mode: Mode): Rule | null;
    /**
     * Whether only one instance of this rule is allowed in a grid.
     */
    get isSingleton(): boolean;
}

declare type RuleState = {
    readonly state: State.Error;
    readonly positions: readonly Position_2[];
} | {
    readonly state: State.Satisfied;
} | {
    readonly state: State.Incomplete;
} | {
    readonly state: State.Ignored;
};

/**
 * The insight solver's main loop: iterate the lemmas in order and apply them to the context.
 * As soon as one makes progress, restart from the first lemma — cheap deductions are always
 * re-attempted before expensive ones. The loop ends after a full pass with no changes.
 *
 * Used by the worker for real solves and by speculative lemmas on copied contexts.
 */
declare function runLemmaLoop(context: InsightContext, lemmas: readonly InsightLemma[], hooks?: LemmaLoopHooks): void;

declare class SameCountPerZoneRule extends CellCountPerZoneRule {
    readonly color: Color;
    readonly title = "Equal Count Per Zone";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly EXAMPLE_GRID_GRAY;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Zones of the same size have the same number of &lt;color&gt; cells.**
     *
     * @param color - The color of the cells to count.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
}

declare class SameShapeBTModule extends RegionShapeBTModule {
    instr: SameShapeRule;
    constructor(instr: SameShapeRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare class SameShapeRule extends RegionShapeRule {
    readonly title = "Same Shape Areas";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **All &lt;color&gt; areas have the same shape and size**
     *
     * @param color - The color of the regions to compare.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
}

declare function sanitizePatternGrid(pattern: GridData, tileMapper?: (tile: TileData) => TileData): GridData;

declare interface SearchVariant {
    description: string;
    rule: Rule;
}

declare class SeparateDisconnectedRegions extends InsightLemma {
    readonly id = "separate-disconnected-regions";
    isApplicable(_grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

/**
 * The master serializer for puzzles.
 *
 * It uses the default serializer when stringifying puzzles, and select the correct deserializer when parsing puzzles.
 */
declare const Serializer: {
    stringifyTiles(tiles: readonly (readonly TileData[])[]): string;
    parseTiles(input: string): TileData[][];
    stringifyRule(rule: Rule): string;
    parseRule(input: string): Rule;
    stringifySymbol(symbol: _Symbol): string;
    parseSymbol(input: string): _Symbol;
    stringifyGrid(grid: GridData): string;
    parseGrid(input: string): GridData;
    stringifyGridWithSolution(puzzle: PuzzleData): string;
    parseGridWithSolution(input: string): PuzzleData;
    /**
     * Convert a puzzle to a string.
     * @param puzzle The puzzle to convert.
     * @returns The string representation of the puzzle.
     */
    stringifyPuzzle(puzzle: Puzzle): string;
    /**
     * Parse a puzzle from a string.
     * @param input The string to parse.
     * @returns The parsed puzzle.
     */
    parsePuzzle(input: string): Puzzle;
};

declare abstract class SerializerBase {
    abstract get version(): number;
    abstract stringifyTile(tile: TileData): string;
    abstract parseTile(str: string): TileData;
    abstract stringifyRule(rule: Rule): string;
    abstract stringifySymbol(symbol: _Symbol): string;
    abstract parseRule(str: string): Rule;
    abstract parseSymbol(str: string): _Symbol;
    abstract stringifyConnections(connections: GridConnections): string;
    abstract parseConnections(input: string): GridConnections;
    abstract stringifyZones(zones: GridZones): string;
    abstract parseZones(input: string): GridZones;
    abstract stringifyTiles(tiles: readonly (readonly TileData[])[]): string;
    abstract parseTiles(input: string): TileData[][];
    abstract stringifyRules(rules: readonly Rule[]): string;
    abstract parseRules(input: string): Rule[];
    abstract stringifySymbols(symbols: ReadonlyMap<string, readonly _Symbol[]>): string;
    abstract parseSymbols(input: string): Map<string, _Symbol[]>;
    abstract stringifyGrid(grid: GridData): string;
    abstract parseGrid(input: string): GridData;
    abstract stringifyGridWithSolution(puzzle: PuzzleData): string;
    abstract parseGridWithSolution(input: string): PuzzleData;
    abstract stringifyPuzzle(puzzle: Puzzle): string;
    abstract parsePuzzle(input: string): Puzzle;
}

declare class SerializerChecksum extends SerializerV0 {
    readonly version: number;
    parseTile(_str: string): TileData;
    stringifyControlLine(line: ControlLine): string;
    parseControlLine(_str: string): ControlLine;
    stringifyConfig(instruction: Instruction, config: AnyConfig): string;
    parseConfig(_configs: readonly AnyConfig[], _entry: string): [string, unknown];
    parseRule(_str: string): Rule;
    parseSymbol(_str: string): _Symbol;
    parseConnections(_input: string): GridConnections;
    stringifyZones(zones: GridZones): string;
    parseZones(_input: string): GridZones;
    parseTiles(_input: string): TileData[][];
    stringifyRules(rules: readonly Rule[]): string;
    parseRules(_input: string): Rule[];
    stringifySymbols(symbols: ReadonlyMap<string, readonly _Symbol[]>): string;
    parseSymbols(_input: string): Map<string, _Symbol[]>;
    stringifyGrid(grid: GridData): string;
    parseGrid(_input: string): GridData;
    stringifyGridWithSolution(puzzle: PuzzleData): string;
    parseGridWithSolution(_input: string): PuzzleData;
    stringifyPuzzle(puzzle: Puzzle): string;
    parsePuzzle(_input: string): Puzzle;
}

declare class SerializerV0 extends SerializerBase {
    readonly version: number;
    stringifyTile(tile: TileData): string;
    parseTile(str: string): TileData;
    stringifyControlLine(line: ControlLine): string;
    parseControlLine(str: string): ControlLine;
    stringifyConfig(instruction: Instruction, config: AnyConfig): string;
    parseConfig(configs: readonly AnyConfig[], entry: string): [string, unknown];
    stringifyInstruction(instruction: Instruction): string;
    stringifyRule(rule: Rule): string;
    stringifySymbol(symbol: _Symbol): string;
    parseRule(str: string): Rule;
    parseSymbol(str: string): _Symbol;
    stringifyConnections(connections: GridConnections): string;
    parseConnections(input: string): GridConnections;
    stringifyZones(zones: GridZones): string;
    parseZones(input: string): GridZones;
    stringifyTiles(tiles: readonly (readonly TileData[])[]): string;
    parseTiles(input: string): TileData[][];
    stringifyRules(rules: readonly Rule[]): string;
    parseRules(input: string): Rule[];
    stringifySymbols(symbols: ReadonlyMap<string, readonly _Symbol[]>): string;
    parseSymbols(input: string): Map<string, _Symbol[]>;
    stringifyGrid(grid: GridData): string;
    parseGrid(input: string): GridData;
    stringifyGridWithSolution(puzzle: PuzzleData): string;
    parseGridWithSolution(input: string): PuzzleData;
    stringifyPuzzle(puzzle: Puzzle): string;
    parsePuzzle(input: string): Puzzle;
}

declare function setColor(grid: GridData, tiles: TileData[][], x: number, y: number, color: Color): void;

declare interface SetGridHandler {
    onSetGrid(oldGrid: GridData, newGrid: GridData, solution: GridData | null): GridData;
}

declare function setOneColor(tiles: TileData[][], x: number, y: number, color: Color): void;

declare function setOneOppositeColor(tiles: TileData[][], x: number, y: number, color: Color): void;

declare function setOppositeColor(grid: GridData, tiles: TileData[][], x: number, y: number, color: Color): void;

declare interface Shape {
    width: number;
    height: number;
    elements: ShapeElement[];
}

declare interface ShapeConfig extends Config<GridData> {
    readonly type: ConfigType.Shape;
    readonly resizable: boolean;
}

declare interface ShapeElement {
    x: number;
    y: number;
    color: Color;
}

declare function shapeEquals(a: Shape, b: Shape): boolean;

declare type ShapeRegions = {
    regions: {
        positions: Position_2[];
        shape: Shape;
        count: number;
    }[];
    complete: boolean;
};

declare interface SolvePathConfig extends Config<Position_2[]> {
    readonly type: ConfigType.SolvePath;
}

/**
 * Base class that all solvers must extend.
 */
declare abstract class Solver {
    /**
     * The unique identifier of the solver.
     *
     * This is also displayed to the user when selecting a solver.
     */
    abstract get id(): string;
    /**
     * The author(s) of the solver.
     */
    abstract get author(): string;
    /**
     * A short paragraph describing when the user should use this solver.
     */
    abstract get description(): string;
    /**
     * Whether the solver supports cancellation. If `true`, the solver must respond to the abort signal if it is provided.
     */
    abstract get supportsCancellation(): boolean;
    /**
     * Solve the given grid. The implementation should delegate long-running tasks to a worker thread and yield solutions
     * asynchronously.
     *
     * The solver must yield at least once, otherwise the UI will not update.
     *
     * If the solver finds no solution other than those already yielded, it should yield `null`. Yielding `null` on the
     * first iteration indicates that the grid is unsolvable. Yielding `null` on the second iteration indicates that the
     * solution is unique.
     *
     * If the solve finds the trivial solution of not filling any tiles, such as in the case of an underclued grid with
     * too many alternate solutions, it must yield the solution instead of yielding `null`.
     *
     * In the current UI implementation, the solver will be terminated after yielding `null`, or after 2 iterations if
     * `null` is never yielded. The solver should perform any necessary cleanup in the `finally` block of the generator.
     *
     * @param grid The grid to solve. The provided grid is guaranteed to be supported by the solver. Some tiles in the
     * grid may already be filled by the user. It is up to the solver to decide whether to respect these tiles or not.
     * @param abortSignal An optional signal that the solver should subscribe to in order to cancel the operation. If the
     * solver does not support cancellation, it should ignore this parameter.
     */
    abstract solve(grid: GridData, abortSignal?: AbortSignal): AsyncGenerator<GridData | null>;
    /**
     * Check if the solver supports the current browser environment. This method is called once when the user first clicks
     * the "Solve" button, and the result is cached for the duration of the editor session.
     *
     * The `solve` method will not be called if this method returns `false`, and a message will be displayed to the user
     * indicating that the solver is not supported.
     *
     * @returns A promise that resolves to `true` if the environment is supported, or `false` otherwise.
     */
    protected isEnvironmentSupported(): Promise<boolean>;
    readonly environmentCheck: CachedAccess<Promise<boolean>>;
    /**
     * Check if the solver supports the given instruction. This is used to render a small indication in the UI for each
     * instruction in the editor.
     *
     * @param instructionId The unique identifier of the instruction.
     */
    isInstructionSupported(_grid: GridData, instruction: Instruction): boolean;
    /**
     * Check if the solver supports the given grid. This methid is frequently called when the user changes the grid, and
     * the result is used to enable or disable the "Solve" button.
     *
     * The `solve` method will not be called if this method returns `false`, and a message will be displayed to the user
     * indicating that the grid is not supported by this solver.
     *
     * @param grid The grid to check.
     * @returns `true` if the grid is supported, or `false` otherwise.
     */
    isGridSupported(grid: GridData): boolean;
}

/**
 * Speculatively fills a gray cell with each color and tries to solve the rest of the puzzle
 * with all other lemmas. If a hypothesis leads to a contradiction (an insight error, or a grid
 * left in an invalid state), the cell must be the opposite color.
 *
 * When several hypotheses lead to contradictions, the one with the shortest path to
 * contradiction (fewest successful lemma applications) is reported. A speculation is
 * terminated early once its lemma count exceeds the current best, since it can no longer
 * improve it.
 *
 * The emitted proof includes the proofs of the speculative pass as children, ending with the
 * contradiction itself when one was detected by a lemma or store.
 *
 * This is the most powerful and most expensive lemma, so it is registered last and only runs
 * when no other lemma can make progress. It is excluded from its own speculative solve loops
 * to avoid recursion (the import cycle with `allLemmas` is safe: the list is only read at
 * apply time, after both modules are fully initialized).
 */
declare class SpeculativeSolve extends InsightLemma {
    readonly id = "speculative-solve";
    isApplicable(_grid: GridData): boolean;
    apply(context: InsightContext): boolean;
}

declare enum State {
    /**
     * Describes the violation of a rule.
     */
    Error = "error",
    /**
     * Describes that a rule is satisfied and complete in the current grid.
     */
    Satisfied = "satisfied",
    /**
     * Describes that a rule is not violated, but is not yet complete in the current grid.
     */
    Incomplete = "incomplete",
    /**
     * Describes that a rule is violated but ignored due to the effect of another rule.
     */
    Ignored = "ignored"
}

declare namespace State {
    export function isSatisfied(state: State): boolean;
}

declare abstract class StreamCompressor extends CompressorBase {
    protected abstract get algorithm(): CompressionFormat;
    compress(input: string): Promise<string>;
    decompress(input: string): Promise<string>;
}

declare interface StringConfig extends Config<string> {
    readonly type: ConfigType.String;
    readonly maxLength?: number;
    readonly placeholder?: string;
}

declare abstract class _Symbol extends Instruction implements GridResizeHandler {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number);
    abstract validateSymbol(grid: GridData, solution: GridData | null): State;
    modeVariant(_mode: Mode): _Symbol | null;
    onGridResize(_grid: GridData, mode: 'insert' | 'remove', direction: 'row' | 'column', index: number): this | null;
    /**
     * The step size for the x and y coordinates of the symbol.
     */
    get placementStep(): number;
    /**
     * The order in which symbols are displayed on the instruction list. Lower values are displayed first.
     */
    get sortOrder(): number;
    withX(x: number): this;
    withY(y: number): this;
    withPosition(x: number, y: number): this;
    /**
     * For symbols that can be placed between tiles, this method implements the default validation logic,
     * which requires all tiles touching the symbol to be either gray or of the same color.
     */
    protected validateSubtilePlacement(grid: GridData): boolean;
}

/** The distinct cells a symbol touches (one for integer positions, up to four for subtiles). */
declare function symbolCorners(symbol: _Symbol): Position_2[];

/**
 * Forces symbol membership when a region's reachable symbol count hits a symbols-per-area bound.
 *
 * - Lower bound (`exactly`/`at least`): if the region can reach exactly the required number of
 *   symbols, every reachable symbol must end up inside it, so they are connected to the region.
 * - Upper bound (`exactly`/`at most`): if the region already holds the allowed number of symbols,
 *   no further symbol may join, so the remaining reachable symbols are disconnected from it.
 *
 * Symbols are counted the way the rule validates them: a symbol touches the region when one of
 * its corner cells is in the region map, and is reachable when that cell is not provably outside.
 */
declare class SymbolCountBounds extends InsightLemma {
    readonly id = "symbol-count-bounds";
    isApplicable(grid: GridData): boolean;
    apply(context: InsightContext): boolean;
    private classify;
}

declare interface SymbolDisplayHandler {
    /**
     * Controls whether a symbol should be visible in the grid.
     *
     * @param grid The grid that is being displayed.
     * @param solution The solution grid, if it is available.
     * @param symbol The symbol that is being displayed.
     * @param editing Whether the grid is being edited.
     * @returns True if the symbol should be displayed, false otherwise. The symbol will not be displayed if any handler returns false.
     */
    onSymbolDisplay(grid: GridData, solution: GridData | null, symbol: _Symbol, editing: boolean): boolean;
}

declare interface SymbolMergeHandler {
    /**
     * Determines if the description of two symbols can be merged when displayed in the UI.
     * @param other The other symbol to compare against.
     */
    descriptionEquals(other: _Symbol): boolean;
}

declare class SymbolsPerRegionBTModule extends BTModule {
    instr: SymbolsPerRegionRule;
    private symbolMap;
    constructor(instr: SymbolsPerRegionRule, width: number, height: number, allSymbols: _Symbol[]);
    checkGlobal(grid: BTGridData): CheckResult | false;
    private visitArea;
}

declare class SymbolsPerRegionRule extends Rule {
    readonly color: Color;
    readonly count: number;
    readonly comparison: Comparison;
    readonly title = "Symbols Per Area";
    private static readonly SYMBOL_POSITIONS;
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRIDS;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Exactly &lt;count&gt; symbols per &lt;color&gt; area**
     *
     * @param color - Color of the region affected by the rule
     * @param count - Number of symbols to have in each region
     * @param comparison - Comparison to use when checking the number of symbols
     */
    constructor(color: Color, count: number, comparison?: Comparison);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ count, color, comparison, }: {
        count?: number;
        color?: Color;
        comparison?: Comparison;
    }): this;
    withColor(color: Color): this;
    withCount(count: number): this;
    withComparison(comparison: Comparison): this;
}

declare interface SymbolValidationHandler {
    /**
     * Overrides the validation of symbols.
     *
     * You can return a different validation result, or call the original validation logic with a modified grid.
     *
     * @param grid - The grid to validate.
     * @param _symbol - The symbol to validate.
     * @param validator - The original validation logic for the symbol.
     * @returns The state of the symbol after validation.
     */
    onSymbolValidation(grid: GridData, symbol: _Symbol, validator: (grid: GridData) => State): State | undefined;
}

/**
 * The symmetry that the given symbol imposes on its region, or an empty list if the symbol does
 * not impose one (either because it is not a symmetry symbol, or because it is placed so that its
 * axis or center does not map cell centers to cell centers).
 */
declare function symmetriesOf(symbol: _Symbol): Symmetry[];

/**
 * An isometry of the grid, written in doubled coordinates so that axes and centers landing on
 * cell corners are represented exactly:
 *
 * ```
 * X' = m00 * X + m01 * Y + t0
 * Y' = m10 * X + m11 * Y + t1
 * ```
 *
 * where `X = 2x` and `Y = 2y` for a cell at `(x, y)`. All fields are integers.
 */
declare interface Symmetry {
    readonly m00: number;
    readonly m01: number;
    readonly m10: number;
    readonly m11: number;
    readonly t0: number;
    readonly t1: number;
}

declare interface SymmetryGroup {
    /** Every element of the generated group, including the identity. */
    readonly elements: readonly Symmetry[];
    /** True when the group contains a non-zero translation, so it is infinite. */
    readonly infinite: boolean;
}

declare function symmetryKey(symmetry: Symmetry): string;

declare interface TileChange {
    oldGrid: GridData;
    newGrid: GridData;
    proof: Proof;
}

declare interface TileConfig extends Config<GridData> {
    readonly type: ConfigType.Tile;
    readonly resizable: boolean;
}

declare class TileConnections {
    [y: number]: {
        [x: number]: boolean;
    };
    constructor();
    get topLeft(): boolean;
    set topLeft(value: boolean);
    get top(): boolean;
    set top(value: boolean);
    get topRight(): boolean;
    set topRight(value: boolean);
    get left(): boolean;
    set left(value: boolean);
    get center(): boolean;
    set center(value: boolean);
    get right(): boolean;
    set right(value: boolean);
    get bottomLeft(): boolean;
    set bottomLeft(value: boolean);
    get bottom(): boolean;
    set bottom(value: boolean);
    get bottomRight(): boolean;
    set bottomRight(value: boolean);
    equals(other: TileConnections): boolean;
}

declare class TileData {
    readonly exists: boolean;
    readonly fixed: boolean;
    readonly color: Color;
    constructor(exists: boolean, fixed: boolean, color: Color);
    /**
     * Create a gray tile.
     */
    static empty(): TileData;
    /**
     * Create a non-existent tile.
     */
    static doesNotExist(): TileData;
    copyWith({ exists, fixed, color, }: {
        exists?: boolean;
        fixed?: boolean;
        color?: Color;
    }): this;
    withExists(exists: boolean): this;
    withFixed(fixed: boolean): this;
    withColor(color: Color): this;
    get isFixed(): boolean;
    equals(other: TileData): boolean;
    static create(char: string): TileData;
}

declare interface TileMethods {
    get: (x: number, y: number) => TileData;
    setColor: (x: number, y: number, color: Color) => void;
    setOneColor: (x: number, y: number, color: Color) => void;
    setOppositeColor: (x: number, y: number, color: Color) => void;
    setOneOppositeColor: (x: number, y: number, color: Color) => void;
}

declare function tilesToShape(tiles: readonly (readonly TileData[])[]): Shape;

declare class UndercluedRule extends Rule {
    readonly title = "Underclued";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID;
    private static readonly SEARCH_VARIANTS;
    /**
     * **Underclued Grid: Mark only what is definitely true**
     *
     * This rule validates answers based on the provided solution.
     */
    constructor();
    get id(): string;
    get explanation(): string;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(_grid: GridData): RuleState;
    copyWith(_: object): this;
    get validateWithSolution(): boolean;
    get isSingleton(): boolean;
}

/**
 * Unescape the given text by replacing HTML escape sequences with the corresponding characters.
 * @param text The text to unescape.
 * @param escapeCharacters The characters to unescape. This should match the characters escaped by the `escape` function.
 * @returns The unescaped text.
 */
declare function unescape(text: string, escapeCharacters?: string): string;

declare class UniqueShapeBTModule extends RegionShapeBTModule {
    instr: UniqueShapeRule;
    constructor(instr: UniqueShapeRule);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare class UniqueShapeRule extends RegionShapeRule {
    readonly title = "Unique Shape Areas";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID_LIGHT;
    private static readonly EXAMPLE_GRID_DARK;
    private static readonly SEARCH_VARIANTS;
    /**
     * **No two &lt;color&gt; areas have the same shape and size**
     *
     * @param color - The color of the regions to compare.
     */
    constructor(color: Color);
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ color }: {
        color?: Color;
    }): this;
}

declare class UniversalSolver extends EventIteratingSolver {
    readonly id = "universal";
    readonly author = "romain22222, Lysine";
    readonly description = "A backtracking solver that supports all rules and symbols (including underclued) but is less optimized.";
    protected createWorker(): Worker;
}

/**
 * A marker for symbols not supported by the current solver.
 * Solvers should count these symbols in the symbols per region rule but otherwise ignore them.
 */
declare class UnsupportedSymbol extends _Symbol {
    readonly title = "Unsupported Symbol";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    get id(): string;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    validateSymbol(_grid: GridData, _solution: GridData | null): State;
    copyWith({ x, y }: {
        x?: number;
        y?: number;
    }): this;
}

declare function validateGrid(grid: GridData, solution: GridData | null): GridState;

declare function validatePuzzleChecklist(metadata: PuzzleMetadata, gridWithSolution: GridData, state: GridState): PuzzleChecklist;

declare class ViewpointBTModule extends BTModule {
    instr: ViewpointSymbol;
    constructor(instr: ViewpointSymbol);
    checkGlobal(grid: BTGridData): CheckResult | false;
}

declare class ViewpointSymbol extends NumberSymbol {
    readonly title = "Viewpoint Number";
    private static readonly CONFIGS;
    private static readonly EXAMPLE_GRID;
    /**
     * **Viewpoint Numbers count visible cells in the four directions**
     * @param x - The x-coordinate of the symbol.
     * @param y - The y-coordinate of the symbol.
     * @param number - The viewpoint number.
     */
    constructor(x: number, y: number, number: number);
    get id(): string;
    get placementStep(): number;
    get explanation(): string;
    get configs(): readonly AnyConfig[] | null;
    createExampleGrid(): GridData;
    private countForColor;
    countTiles(grid: GridData): {
        completed: number;
        possible: number;
    };
    copyWith({ x, y, number, }: {
        x?: number;
        y?: number;
        number?: number;
    }): this;
    withNumber(number: number): this;
}

declare class WrapAroundRule extends Rule implements GetTileHandler {
    readonly horizontal: Wrapping;
    readonly vertical: Wrapping;
    readonly title = "Wrap Around";
    get configExplanation(): string;
    private static readonly EXAMPLE_GRID_NONE;
    private static readonly EXAMPLE_GRID_HORIZONTAL;
    private static readonly EXAMPLE_GRID_VERTICAL;
    private static readonly SEARCH_VARIANTS;
    private static readonly CONFIGS;
    /**
     * **The left and right edges are connected (in reverse)**
     *
     * @param horizontal - The horizontal wrapping.
     * @param vertical - The vertical wrapping.
     */
    constructor(horizontal: Wrapping, vertical: Wrapping);
    onGetTile(x: number, y: number, grid: GridData): Position_2;
    get id(): string;
    get explanation(): string;
    createExampleGrid(): GridData;
    get configs(): readonly AnyConfig[] | null;
    get searchVariants(): SearchVariant[];
    validateGrid(grid: GridData): RuleState;
    copyWith({ horizontal, vertical, }: {
        horizontal?: Wrapping;
        vertical?: Wrapping;
    }): this;
    get isSingleton(): boolean;
}

declare enum Wrapping {
    None = "none",
    Wrap = "wrap",
    WrapReverse = "wrap-reverse",
    ReflectReverse = "reflect-reverse"
}

declare interface WrappingConfig extends Config<Wrapping> {
    readonly type: ConfigType.Wrapping;
}

declare const WRAPPINGS: readonly Wrapping[];

declare interface Zone {
    positions: Position_2[];
    completed: number;
    possible: number;
}

declare type ZoneCounts = {
    zones: Zone[];
    complete: boolean;
};


/* prettier-ignore-end */
