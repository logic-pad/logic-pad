import { handlesGridChange } from './events/onGridChange.js';
import { handlesGridResize } from './events/onGridResize.js';
import { handlesSetGrid } from './events/onSetGrid.js';
import GridConnections from './gridConnections.js';
import { CachedAccess, array, move } from './dataHelper.js';
import {
  Color,
  Direction,
  MajorRule,
  Orientation,
  Position,
} from './primitives.js';
import Rule from './rules/rule.js';
import Symbol from './symbols/symbol.js';
import TileData from './tile.js';
import MusicGridRule from './rules/musicGridRule.js';
import CompletePatternRule from './rules/completePatternRule.js';
import UndercluedRule from './rules/undercluedRule.js';
import GridZones from './gridZones.js';
import WrapAroundRule from './rules/wrapAroundRule.js';

export const NEIGHBOR_OFFSETS: Position[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

export const NEIGHBOR_OFFSETS_8: Position[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
];

export default class GridData {
  public readonly tiles: readonly (readonly TileData[])[];
  public readonly connections: GridConnections;
  public readonly zones: GridZones;
  public readonly symbols: ReadonlyMap<string, readonly Symbol[]>;
  public readonly rules: readonly Rule[];

  // Important rules are cached for quick access
  /* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */

  public readonly musicGrid: CachedAccess<MusicGridRule | undefined> =
    CachedAccess.of(
      () =>
        this.findRule(rule => rule.id === MajorRule.MusicGrid) as
          | MusicGridRule
          | undefined
    );

  public readonly completePattern: CachedAccess<
    CompletePatternRule | undefined
  > = CachedAccess.of(
    () =>
      this.findRule(rule => rule.id === MajorRule.CompletePattern) as
        | CompletePatternRule
        | undefined
  );

  public readonly underclued: CachedAccess<UndercluedRule | undefined> =
    CachedAccess.of(
      () =>
        this.findRule(rule => rule.id === MajorRule.Underclued) as
          | UndercluedRule
          | undefined
    );

  public readonly wrapAround: CachedAccess<WrapAroundRule | undefined> =
    CachedAccess.of(
      () =>
        this.findRule(rule => rule.id === MajorRule.WrapAround) as
          | WrapAroundRule
          | undefined
    );

  /* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */

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
  public constructor(
    public readonly width: number,
    public readonly height: number,
    tiles?: readonly (readonly TileData[])[],
    connections?: GridConnections,
    zones?: GridZones,
    symbols?: ReadonlyMap<string, readonly Symbol[]>,
    rules?: readonly Rule[]
  ) {
    this.width = width;
    this.height = height;
    this.tiles = tiles ?? array(width, height, () => TileData.empty());
    this.connections = connections ?? new GridConnections();
    this.zones = zones ?? new GridZones();
    this.symbols = symbols ?? new Map<string, Symbol[]>();
    this.rules = rules ?? [];
  }

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
  public static create(array: string[]): GridData;

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
  public static create(
    width: number,
    height: number,
    tiles?: readonly (readonly TileData[])[],
    connections?: GridConnections,
    zones?: GridZones,
    symbols?: ReadonlyMap<string, readonly Symbol[]>,
    rules?: readonly Rule[],
    sanitize?: boolean,
    triggerEvents?: boolean
  ): GridData;

  public static create(
    arrayOrWidth: string[] | number,
    height?: number,
    tiles?: readonly (readonly TileData[])[],
    connections?: GridConnections,
    zones?: GridZones,
    symbols?: ReadonlyMap<string, readonly Symbol[]>,
    rules?: readonly Rule[],
    sanitize?: boolean,
    triggerEvents?: boolean
  ): GridData {
    if (typeof arrayOrWidth === 'number') {
      let hasGridChangeSymbols = false;
      let hasGridChangeRules = false;
      if (triggerEvents) {
        symbols?.forEach(list => {
          list.forEach(sym => {
            if (handlesGridChange(sym)) {
              hasGridChangeSymbols = true;
            }
          });
        });
        rules?.forEach(rule => {
          if (handlesGridChange(rule)) {
            hasGridChangeRules = true;
          }
        });
      }
      const newSymbols = symbols
        ? sanitize
          ? GridData.deduplicateSymbols(symbols)
          : triggerEvents && hasGridChangeSymbols
            ? new Map(
                [...symbols.entries()].map(([id, list]) => [id, list.slice()])
              )
            : symbols
        : new Map<string, Symbol[]>();
      // do not deduplicate all rules because it makes for bad editor experience
      const newRules = rules
        ? sanitize
          ? GridData.deduplicateSingletonRules(rules)
          : triggerEvents && hasGridChangeRules
            ? rules.slice()
            : rules
        : [];
      const newGrid = new GridData(
        arrayOrWidth,
        height!,
        tiles,
        connections
          ? sanitize
            ? GridConnections.validateEdges(connections, arrayOrWidth, height!)
            : connections
          : undefined,
        zones
          ? sanitize
            ? GridZones.validateEdges(zones, arrayOrWidth, height!)
            : zones
          : undefined,
        newSymbols,
        newRules
      );
      if (triggerEvents) {
        newSymbols.forEach(list => {
          list.forEach((sym, i) => {
            if (handlesGridChange(sym)) {
              (list as Symbol[])[i] = sym.onGridChange(newGrid);
            }
          });
        });
        newRules.forEach((rule, i) => {
          if (handlesGridChange(rule)) {
            (newRules as Rule[])[i] = rule.onGridChange(newGrid);
          }
        });
      }
      return newGrid;
    } else {
      const tiles = GridData.createTiles(arrayOrWidth);
      return GridData.create(tiles[0]?.length ?? 0, tiles.length, tiles);
    }
  }

  /**
   * Copy the current grid while modifying the provided properties.
   * @param param0 The properties to modify.
   * @returns The new grid with the modified properties.
   */
  public copyWith(
    {
      width,
      height,
      tiles,
      connections,
      zones,
      symbols,
      rules,
    }: {
      width?: number;
      height?: number;
      tiles?: readonly (readonly TileData[])[];
      connections?: GridConnections;
      zones?: GridZones;
      symbols?: ReadonlyMap<string, readonly Symbol[]>;
      rules?: readonly Rule[];
    },
    sanitize = true,
    triggerEvents = true
  ): GridData {
    return GridData.create(
      width ?? this.width,
      height ?? this.height,
      tiles ?? this.tiles,
      connections ?? this.connections,
      zones ?? this.zones,
      symbols ?? this.symbols,
      rules ?? this.rules,
      sanitize,
      triggerEvents
    );
  }

  public toArrayCoordinates(x: number, y: number): Position {
    // // This is the preferred way to compute tile coordinates, but for performance reasons we will just access the
    // // wrap-around rule directly.
    // this.rules.forEach(rule => {
    //   if (handlesGetTile(rule)) {
    //     ({ x, y } = rule.onGetTile(x, y));
    //   }
    // });
    // this.symbols.forEach(list =>
    //   list.forEach(symbol => {
    //     if (handlesGetTile(symbol)) {
    //       ({ x, y } = symbol.onGetTile(x, y));
    //     }
    //   })
    // );

    if (this.wrapAround.value) {
      return this.wrapAround.value.onGetTile(x, y, this);
    } else {
      return { x, y };
    }
  }

  public isPositionValid(x: number, y: number) {
    ({ x, y } = this.toArrayCoordinates(x, y));
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Safely get the tile at the given position.
   * @param x The x-coordinate of the tile.
   * @param y The y-coordinate of the tile.
   * @returns The tile at the given position, or a non-existent tile if the position is invalid.
   */
  public getTile(x: number, y: number): TileData {
    ({ x, y } = this.toArrayCoordinates(x, y));
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return TileData.doesNotExist();
    return this.tiles[y][x];
  }

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
  public setTile(
    x: number,
    y: number,
    tile: TileData | ((tile: TileData) => TileData)
  ): readonly (readonly TileData[])[] {
    ({ x, y } = this.toArrayCoordinates(x, y));

    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return this.tiles;
    }

    const changing = this.connections.getConnectedTiles({ x, y });
    const tiles = this.tiles.map(row => [...row]);
    const newTile = typeof tile === 'function' ? tile(tiles[y][x]) : tile;

    changing.forEach(({ x, y }) => {
      ({ x, y } = this.toArrayCoordinates(x, y));
      tiles[y][x] = tiles[y][x].withColor(newTile.color);
    });
    tiles[y][x] = newTile;

    return tiles;
  }

  /**
   * Replace or modify all tiles in the grid.
   *
   * @param tiles The new tile array or a function to mutate the existing tile array.
   * @returns The new grid with the new tiles.
   */
  public withTiles(
    tiles:
      | readonly (readonly TileData[])[]
      | ((value: TileData[][]) => readonly (readonly TileData[])[])
  ): GridData {
    return this.copyWith({
      tiles:
        typeof tiles === 'function'
          ? tiles(this.tiles.map(row => row.slice()))
          : tiles,
    });
  }

  /**
   * Add or modify the connections in the grid.
   * @param connections The new connections to add or modify.
   * @returns The new grid with the new connections.
   */
  public withConnections(
    connections: GridConnections | ((value: GridConnections) => GridConnections)
  ): GridData {
    return this.copyWith({
      connections:
        typeof connections === 'function'
          ? connections(this.connections)
          : connections,
    });
  }

  /**
   * Add or modify the zones in the grid.
   * @param zones The new zones to add or modify.
   * @returns The new grid with the new zones.
   */
  public withZones(
    zones: GridZones | ((value: GridZones) => GridZones)
  ): GridData {
    return this.copyWith({
      zones: typeof zones === 'function' ? zones(this.zones) : zones,
    });
  }

  /**
   * Add or modify the symbols in the grid.
   * @param symbols The new symbols to add or modify.
   * @returns The new grid with the new symbols.
   */
  public withSymbols(
    symbols:
      | readonly Symbol[]
      | ReadonlyMap<string, readonly Symbol[]>
      | ((
          value: Map<string, readonly Symbol[]>
        ) => ReadonlyMap<string, readonly Symbol[]>)
  ): GridData {
    if (symbols instanceof Array) {
      const map = new Map<string, Symbol[]>();
      for (const symbol of symbols) {
        if (map.has(symbol.id)) {
          map.set(symbol.id, [...map.get(symbol.id)!, symbol]);
        } else {
          map.set(symbol.id, [symbol]);
        }
      }
      return this.copyWith({ symbols: map });
    }
    return this.copyWith({
      symbols:
        typeof symbols === 'function'
          ? symbols(new Map(this.symbols))
          : symbols,
    });
  }

  /**
   * Add a new symbol to the grid.
   * @param symbol The symbol to add.
   * @returns The new grid with the new symbol.
   */
  public addSymbol(symbol: Symbol): GridData {
    return this.withSymbols(map => {
      if (map.has(symbol.id)) {
        return map.set(symbol.id, [...map.get(symbol.id)!, symbol]);
      } else {
        return map.set(symbol.id, [symbol]);
      }
    });
  }

  /**
   * Remove an instance of the symbol from the grid.
   * @param symbol The symbol to remove.
   * @returns The new grid with the symbol removed.
   */
  public removeSymbol(symbol: Symbol): GridData {
    return this.withSymbols(map => {
      if (map.has(symbol.id)) {
        const symbols = map.get(symbol.id)!.filter(s => s !== symbol);
        if (symbols.length === 0) {
          map.delete(symbol.id);
        } else {
          map.set(symbol.id, symbols);
        }
      }
      return map;
    });
  }

  /**
   * Remove all symbols that satisfy the predicate.
   * @param predicate The predicate to test each symbol with.
   * @returns The new grid with the symbols removed.
   */
  public removeSymbolIf(predicate: (symbol: Symbol) => boolean): GridData {
    return this.withSymbols(map => {
      for (const [id, symbols] of map) {
        const newSymbols = symbols.filter(sym => !predicate(sym));
        if (newSymbols.length === 0) {
          map.delete(id);
        } else {
          map.set(id, newSymbols);
        }
      }
      return map;
    });
  }

  /**
   * Find the first symbol that satisfies the predicate.
   * @param predicate The predicate to test each symbol with.
   * @returns The first symbol that satisfies the predicate, or undefined if no symbol is found.
   */
  public findSymbol(
    predicate: (symbol: Symbol) => boolean
  ): Symbol | undefined {
    for (const symbols of this.symbols.values()) {
      const symbol = symbols.find(predicate);
      if (symbol) return symbol;
    }
  }

  /**
   * Replace an existing symbol with a new symbol.
   * @param oldSymbol The symbol to replace.
   * @param newSymbol The new symbol to replace with.
   * @returns The new grid with the symbol replaced.
   */
  public replaceSymbol(oldSymbol: Symbol, newSymbol: Symbol): GridData {
    return this.withSymbols(map => {
      if (map.has(oldSymbol.id)) {
        const symbols = map
          .get(oldSymbol.id)!
          .map(s => (s === oldSymbol ? newSymbol : s));
        map.set(oldSymbol.id, symbols);
      }
      return map;
    });
  }

  /**
   * Add or modify the rules in the grid.
   * @param rules The new rules to add or modify.
   * @returns The new grid with the new rules.
   */
  public withRules(
    rules: readonly Rule[] | ((value: readonly Rule[]) => readonly Rule[])
  ): GridData {
    return this.copyWith({
      rules: typeof rules === 'function' ? rules(this.rules) : rules,
    });
  }

  /**
   * Add a new rule to the grid.
   * @param rule The rule to add.
   * @returns The new grid with the new rule.
   */
  public addRule(rule: Rule): GridData {
    return this.withRules(rules => [...rules, rule]);
  }

  /**
   * Remove an instance of the rule from the grid.
   * @param rule The rule to remove.
   * @returns The new grid with the rule removed.
   */
  public removeRule(rule: Rule): GridData {
    return this.withRules(rules => rules.filter(r => r !== rule));
  }

  /**
   * Remove all rules that satisfy the predicate.
   * @param predicate The predicate to test each rule with.
   * @returns The new grid with the rules removed.
   */
  public removeRuleIf(predicate: (rule: Rule) => boolean): GridData {
    return this.withRules(rules => rules.filter(r => !predicate(r)));
  }

  /**
   * Find the first rule that satisfies the predicate.
   * @param predicate The predicate to test each rule with.
   * @returns The first rule that satisfies the predicate, or undefined if no rule is found.
   */
  public findRule(predicate: (rule: Rule) => boolean): Rule | undefined {
    return this.rules.find(predicate);
  }

  /**
   * Replace an existing rule with a new rule.
   * @param oldRule The rule to replace.
   * @param newRule The new rule to replace with.
   * @returns The new grid with the rule replaced.
   */
  public replaceRule(oldRule: Rule, newRule: Rule): GridData {
    return this.withRules(rules =>
      rules.map(r => (r === oldRule ? newRule : r))
    );
  }

  /**
   * Insert a new column at the given index, shifting all components of the grid accordingly. Newly inserted tiles are gray.
   * @param index The index to insert the column at.
   * @returns The new grid with the new column inserted.
   */
  public insertColumn(index: number): GridData {
    if (index < 0 || index > this.width) return this;
    const tiles = array(this.width + 1, this.height, (x, y) => {
      if (x < index) return this.getTile(x, y);
      if (x === index) return TileData.empty();
      return this.getTile(x - 1, y);
    });
    const connections = this.connections.insertColumn(index);
    const zones = this.zones.insertColumn(index);
    const rules = this.rules
      .map(rule => {
        if (handlesGridResize(rule))
          return rule.onGridResize(this, 'insert', 'column', index);
        else return rule;
      })
      .filter(rule => rule !== null);
    const symbols = new Map<string, Symbol[]>();
    for (const [id, symbolList] of this.symbols) {
      const newList = symbolList
        .map(symbol => symbol.onGridResize(this, 'insert', 'column', index))
        .filter(symbol => symbol !== null);
      if (newList.length > 0) symbols.set(id, newList);
    }
    return this.copyWith({
      width: this.width + 1,
      tiles,
      connections,
      zones,
      rules,
      symbols,
    });
  }

  /**
   * Insert a new row at the given index, shifting all components of the grid accordingly. Newly inserted tiles are gray.
   * @param index The index to insert the row at.
   * @returns The new grid with the new row inserted.
   */
  public insertRow(index: number): GridData {
    if (index < 0 || index > this.height) return this;
    const tiles = array(this.width, this.height + 1, (x, y) => {
      if (y < index) return this.getTile(x, y);
      if (y === index) return TileData.empty();
      return this.getTile(x, y - 1);
    });
    const connections = this.connections.insertRow(index);
    const zones = this.zones.insertRow(index);
    const rules = this.rules
      .map(rule => {
        if (handlesGridResize(rule))
          return rule.onGridResize(this, 'insert', 'row', index);
        else return rule;
      })
      .filter(rule => rule !== null);
    const symbols = new Map<string, Symbol[]>();
    for (const [id, symbolList] of this.symbols) {
      const newList = symbolList
        .map(symbol => symbol.onGridResize(this, 'insert', 'row', index))
        .filter(symbol => symbol !== null);
      if (newList.length > 0) symbols.set(id, newList);
    }
    return this.copyWith({
      height: this.height + 1,
      tiles,
      connections,
      zones,
      rules,
      symbols,
    });
  }

  /**
   * Remove a column at the given index, shifting all components of the grid accordingly.
   * @param index The index to remove the column at.
   * @returns The new grid with the column removed.
   */
  public removeColumn(index: number): GridData {
    if (index < 0 || index >= this.width) return this;
    const tiles = array(this.width - 1, this.height, (x, y) =>
      x < index ? this.getTile(x, y) : this.getTile(x + 1, y)
    );
    const connections = this.connections.removeColumn(index);
    const zones = this.zones.removeColumn(index);
    const rules = this.rules
      .map(rule => {
        if (handlesGridResize(rule))
          return rule.onGridResize(this, 'remove', 'column', index);
        else return rule;
      })
      .filter(rule => rule !== null);
    const symbols = new Map<string, Symbol[]>();
    for (const [id, symbolList] of this.symbols) {
      const newList = symbolList
        .map(symbol => symbol.onGridResize(this, 'remove', 'column', index))
        .filter(symbol => symbol !== null);
      if (newList.length > 0) symbols.set(id, newList);
    }
    return this.copyWith({
      width: this.width - 1,
      tiles,
      connections,
      zones,
      rules,
      symbols,
    });
  }

  /**
   * Remove a row at the given index, shifting all components of the grid accordingly.
   * @param index The index to remove the row at.
   * @returns The new grid with the row removed.
   */
  public removeRow(index: number): GridData {
    if (index < 0 || index >= this.height) return this;
    const tiles = array(this.width, this.height - 1, (x, y) =>
      y < index ? this.getTile(x, y) : this.getTile(x, y + 1)
    );
    const connections = this.connections.removeRow(index);
    const zones = this.zones.removeRow(index);
    const rules = this.rules
      .map(rule => {
        if (handlesGridResize(rule))
          return rule.onGridResize(this, 'remove', 'row', index);
        else return rule;
      })
      .filter(rule => rule !== null);
    const symbols = new Map<string, Symbol[]>();
    for (const [id, symbolList] of this.symbols) {
      const newList = symbolList
        .map(symbol => symbol.onGridResize(this, 'remove', 'row', index))
        .filter(symbol => symbol !== null);
      if (newList.length > 0) symbols.set(id, newList);
    }
    return this.copyWith({
      height: this.height - 1,
      tiles,
      connections,
      zones,
      rules,
      symbols,
    });
  }

  /**
   * Resize the grid to the new width and height, shifting all components of the grid accordingly. Newly inserted tiles are gray.
   * @param width The new width of the grid.
   * @param height The new height of the grid.
   * @returns The new grid with the new dimensions.
   */
  public resize(width: number, height: number): this {
    if (width < 0 || height < 0)
      throw new Error(`Invalid grid size: ${width}x${height}`);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let newGrid: GridData = this;
    while (newGrid.width < width) newGrid = newGrid.insertColumn(newGrid.width);
    while (newGrid.width > width)
      newGrid = newGrid.removeColumn(newGrid.width - 1);
    while (newGrid.height < height) newGrid = newGrid.insertRow(newGrid.height);
    while (newGrid.height > height)
      newGrid = newGrid.removeRow(newGrid.height - 1);
    return newGrid as this;
  }

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
  public static createTiles(array: string[]): TileData[][] {
    const width = array.reduce((max, row) => Math.max(max, row.length), 0);
    return array.map(row =>
      Array.from({ length: width }, (_, x) => {
        return TileData.create(row.charAt(x));
      })
    );
  }

  /**
   * Find a tile in the grid that satisfies the predicate.
   *
   * @param predicate The predicate to test each tile with.
   * @returns The position of the first tile that satisfies the predicate, or undefined if no tile is found.
   */
  public find(
    predicate: (tile: TileData, x: number, y: number) => boolean
  ): Position | undefined {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (predicate(this.getTile(x, y), x, y)) {
          return { x, y };
        }
      }
    }
    return undefined;
  }

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
  public iterateArea<T>(
    position: Position,
    predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean,
    callback: (
      tile: TileData,
      x: number,
      y: number,
      logicalX: number,
      logicalY: number
    ) => undefined | T,
    visited: boolean[][] = array(this.width, this.height, () => false)
  ): T | undefined {
    const tile = this.getTile(position.x, position.y);
    if (!tile.exists || !predicate(tile, position.x, position.y)) {
      return;
    }
    const stack = [position];
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const { x: arrX, y: arrY } = this.toArrayCoordinates(x, y);
      if (visited[arrY][arrX]) {
        continue;
      }
      visited[arrY][arrX] = true;
      const ret = callback(this.getTile(x, y), arrX, arrY, x, y);
      if (ret !== undefined) return ret;
      for (const offset of NEIGHBOR_OFFSETS) {
        const next = { x: x + offset.x, y: y + offset.y };
        if (this.isPositionValid(next.x, next.y)) {
          const nextTile = this.getTile(next.x, next.y);
          if (nextTile.exists && predicate(nextTile, next.x, next.y))
            stack.push(next);
        }
      }
    }
  }

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
  public iterateDirection<T>(
    position: Position,
    direction: Direction | Orientation,
    predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean,
    callback: (
      tile: TileData,
      x: number,
      y: number,
      logicalX: number,
      logicalY: number
    ) => T | undefined,
    visited: boolean[][] = array(this.width, this.height, () => false)
  ): T | undefined {
    return this.iterateDirectionAll(
      position,
      direction,
      (tile, logicalX, logicalY) =>
        tile.exists && predicate(tile, logicalX, logicalY),
      callback,
      visited
    );
  }

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
  public iterateDirectionAll<T>(
    position: Position,
    direction: Direction | Orientation,
    predicate: (tile: TileData, logicalX: number, logicalY: number) => boolean,
    callback: (
      tile: TileData,
      x: number,
      y: number,
      logicalX: number,
      logicalY: number
    ) => T | undefined,
    visited: boolean[][] = array(this.width, this.height, () => false)
  ): T | undefined {
    let current = position;
    while (this.isPositionValid(current.x, current.y)) {
      const arrPos = this.toArrayCoordinates(current.x, current.y);
      if (visited[arrPos.y][arrPos.x]) {
        break;
      }
      visited[arrPos.y][arrPos.x] = true;
      const tile = this.getTile(current.x, current.y);
      if (!predicate(tile, arrPos.x, arrPos.y)) {
        break;
      }
      const ret = callback(tile, arrPos.x, arrPos.y, current.x, current.y);
      if (ret !== undefined) return ret;
      current = move(current, direction);
    }
  }

  /**
   * Reduce the grid by zones defined in the GridZones.
   *
   * @param reducer The reducer function to apply to each zone.
   * @param initializer The initializer function to create the initial value for each zone.
   * @param visited A 2D array to keep track of visited tiles. This array is modified by the function.
   * @returns An array of reduced values, one for each zone.
   */
  public reduceByZone<T>(
    reducer: (
      acc: T,
      tile: TileData,
      x: number,
      y: number,
      logicalX: number,
      logicalY: number
    ) => T,
    initializer: () => T,
    visited: boolean[][] = array(this.width, this.height, () => false)
  ) {
    const zones: T[] = [];
    while (true) {
      const seed = this.find((tile, x, y) => tile.exists && !visited[y][x]);
      if (!seed) break;
      let zone = initializer();
      const stack = [seed];
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        const { x: arrX, y: arrY } = this.toArrayCoordinates(x, y);
        if (visited[arrY][arrX]) continue;
        visited[arrY][arrX] = true;
        zone = reducer(zone, this.getTile(arrX, arrY), arrX, arrY, x, y);
        for (const offset of NEIGHBOR_OFFSETS) {
          const next = this.toArrayCoordinates(x + offset.x, y + offset.y);
          if (
            !this.zones.edges.some(e => {
              const { x: x1, y: y1 } = this.toArrayCoordinates(e.x1, e.y1);
              const { x: x2, y: y2 } = this.toArrayCoordinates(e.x2, e.y2);
              return (
                (x1 === arrX &&
                  y1 === arrY &&
                  x2 === next.x &&
                  y2 === next.y) ||
                (x2 === arrX && y2 === arrY && x1 === next.x && y1 === next.y)
              );
            })
          ) {
            const nextTile = this.getTile(next.x, next.y);
            if (nextTile.exists) {
              stack.push(next);
            }
          }
        }
      }
      zones.push(zone);
    }
    return zones;
  }

  /**
   * Check if every tile in the grid is filled with a color other than gray.
   *
   * @returns True if every tile is filled with a color other than gray, false otherwise.
   */
  public isComplete(): boolean {
    return this.tiles.every(row =>
      row.every(tile => !tile.exists || tile.color !== Color.Gray)
    );
  }

  /**
   * Iterate over all tiles in the grid.
   * The iteration stops when the callback returns a value that is not undefined.
   *
   * @param callback The callback to call for each tile.
   * @returns The value returned by the callback that stopped the iteration, or undefined if the iteration completed.
   */
  public forEach<T>(
    callback: (tile: TileData, x: number, y: number) => T | undefined
  ): T | undefined {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const ret = callback(this.getTile(x, y), x, y);
        if (ret !== undefined) return ret;
      }
    }
  }

  /**
   * Flood fill a continuous region starting from the given position with the given color.
   *
   * @param position The position to start the flood fill from.
   * @param from The color of the tiles to fill.
   * @param to The color to fill the tiles with.
   * @param allowFixed Whether to fill fixed tiles.
   * @returns The new grid with the region filled with the new color.
   */
  public floodFill(
    position: Position,
    from: Color,
    to: Color,
    allowFixed: boolean
  ): GridData {
    const tiles = array(this.width, this.height, (x, y) => this.getTile(x, y));
    this.iterateArea(
      position,
      t => t.color === from && (allowFixed || !t.fixed),
      (tile, x, y) => {
        tiles[y][x] = tile.withColor(to);
      }
    );
    return this.copyWith({ tiles }, false);
  }

  /**
   * Flood fill all tiles with the given color to a new color, even if they are not connected.
   *
   * @param from The color of the tiles to fill.
   * @param to The color to fill the tiles with.
   * @param allowFixed Whether to fill fixed tiles.
   * @returns The new grid with all tiles filled with the new color.
   */
  public floodFillAll(from: Color, to: Color, allowFixed: boolean): GridData {
    return this.copyWith(
      {
        tiles: this.tiles.map(row =>
          row.map(tile =>
            tile.color === from && (allowFixed || !tile.fixed)
              ? tile.withColor(to)
              : tile
          )
        ),
      },
      false
    );
  }

  /**
   * Check if the grid has any instructions that require a custom solution.
   * @returns True if the grid has any instructions that require a custom solution, false otherwise.
   */
  public requireSolution(): boolean {
    if (this.rules.some(rule => rule.validateWithSolution)) return true;
    if (
      [...this.symbols.values()].some(list =>
        list.some(symbol => symbol.validateWithSolution)
      )
    )
      return true;
    return false;
  }

  /**
   * Reset all non-fixed tiles to gray.
   *
   * @returns The new grid with all non-fixed tiles reset to gray.
   */
  public resetTiles(): this {
    let changed = false;
    const newTiles = array(this.width, this.height, (x, y) => {
      const tile = this.getTile(x, y);
      if (tile.exists && !tile.fixed && tile.color !== Color.Gray) {
        changed = true;
        return tile.withColor(Color.Gray);
      }
      return tile;
    });
    if (!changed) return this;
    let newGrid = this.copyWith({ tiles: newTiles }, false);
    this.symbols.forEach(list => {
      list.forEach(symbol => {
        if (handlesSetGrid(symbol)) {
          newGrid = symbol.onSetGrid(this, newGrid, null);
        }
      });
    });
    this.rules.forEach(rule => {
      if (handlesSetGrid(rule)) {
        newGrid = rule.onSetGrid(this, newGrid, null);
      }
    });
    return newGrid as this;
  }

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
  public copyTiles(origin: Position, width: number, height: number): GridData {
    const newTiles = array(width, height, (x, y) =>
      this.getTile(origin.x + x, origin.y + y)
    );
    const connections = new GridConnections(
      this.connections.edges
        .filter(
          edge =>
            edge.x1 >= origin.x &&
            edge.y1 >= origin.y &&
            edge.x2 >= origin.x &&
            edge.y2 >= origin.y &&
            edge.x1 < origin.x + width &&
            edge.y1 < origin.y + height &&
            edge.x2 < origin.x + width &&
            edge.y2 < origin.y + height
        )
        .map(edge => ({
          x1: edge.x1 - origin.x,
          y1: edge.y1 - origin.y,
          x2: edge.x2 - origin.x,
          y2: edge.y2 - origin.y,
        }))
    );
    const zones = new GridZones(
      this.zones.edges
        .filter(
          edge =>
            edge.x1 >= origin.x &&
            edge.y1 >= origin.y &&
            edge.x2 >= origin.x &&
            edge.y2 >= origin.y &&
            edge.x1 < origin.x + width &&
            edge.y1 < origin.y + height &&
            edge.x2 < origin.x + width &&
            edge.y2 < origin.y + height
        )
        .map(edge => ({
          x1: edge.x1 - origin.x,
          y1: edge.y1 - origin.y,
          x2: edge.x2 - origin.x,
          y2: edge.y2 - origin.y,
        }))
    );
    const symbols = new Map<string, Symbol[]>();
    for (const [id, symbolList] of this.symbols) {
      const newSymbolList = symbolList
        .filter(
          symbol =>
            symbol.x >= origin.x &&
            symbol.y >= origin.y &&
            symbol.x < origin.x + width &&
            symbol.y < origin.y + height
        )
        .map(symbol =>
          symbol.copyWith({
            x: symbol.x - origin.x,
            y: symbol.y - origin.y,
          })
        );
      if (newSymbolList.length > 0) symbols.set(id, newSymbolList);
    }
    return GridData.create(
      width,
      height,
      newTiles,
      connections,
      zones,
      symbols,
      this.rules
    );
  }

  /**
   * Paste the tiles from the given grid to the current grid at the given position.
   * All connections, symbols, and rules are merged.
   *
   * @param origin The top-left corner of the region to paste the tiles to.
   * @param grid The grid to paste the tiles from.
   * @returns The new grid with the pasted tiles.
   */
  public pasteTiles(origin: Position, grid: GridData): GridData;
  /**
   * Paste the tiles from the given array to the current grid at the given position.
   *
   * @param origin The top-left corner of the region to paste the tiles to.
   * @param tile The array of tiles to paste.
   * @returns The new grid with the pasted tiles.
   */
  public pasteTiles(
    origin: Position,
    tile: readonly (readonly TileData[])[]
  ): GridData;

  public pasteTiles(
    origin: Position,
    grid: GridData | readonly (readonly TileData[])[]
  ): GridData {
    if (!(grid instanceof GridData))
      return this.pasteTiles(
        origin,
        new GridData(grid[0].length, grid.length, grid)
      );
    const newTiles = this.tiles.map(row => [...row]);
    grid.forEach((tile, x, y) => {
      if (this.isPositionValid(origin.x + x, origin.y + y))
        newTiles[origin.y + y][origin.x + x] = tile;
    });
    const connections = new GridConnections([
      ...this.connections.edges.filter(
        edge =>
          edge.x1 < origin.x ||
          edge.y1 < origin.y ||
          edge.x2 < origin.x ||
          edge.y2 < origin.y ||
          edge.x1 >= origin.x + grid.width ||
          edge.y1 >= origin.y + grid.height ||
          edge.x2 >= origin.x + grid.width ||
          edge.y2 >= origin.y + grid.height
      ),
      ...grid.connections.edges
        .map(edge => ({
          x1: edge.x1 + origin.x,
          y1: edge.y1 + origin.y,
          x2: edge.x2 + origin.x,
          y2: edge.y2 + origin.y,
        }))
        .filter(
          edge =>
            edge.x1 >= 0 &&
            edge.y1 >= 0 &&
            edge.x2 >= 0 &&
            edge.y2 >= 0 &&
            edge.x1 < this.width &&
            edge.y1 < this.height &&
            edge.x2 < this.width &&
            edge.y2 < this.height
        ),
    ]);
    const zones = new GridZones([
      ...this.zones.edges.filter(
        edge =>
          edge.x1 < origin.x ||
          edge.y1 < origin.y ||
          edge.x2 < origin.x ||
          edge.y2 < origin.y ||
          edge.x1 >= origin.x + grid.width ||
          edge.y1 >= origin.y + grid.height ||
          edge.x2 >= origin.x + grid.width ||
          edge.y2 >= origin.y + grid.height
      ),
      ...grid.zones.edges
        .map(edge => ({
          x1: edge.x1 + origin.x,
          y1: edge.y1 + origin.y,
          x2: edge.x2 + origin.x,
          y2: edge.y2 + origin.y,
        }))
        .filter(
          edge =>
            edge.x1 >= 0 &&
            edge.y1 >= 0 &&
            edge.x2 >= 0 &&
            edge.y2 >= 0 &&
            edge.x1 < this.width &&
            edge.y1 < this.height &&
            edge.x2 < this.width &&
            edge.y2 < this.height
        ),
    ]);
    const symbols = new Map(this.symbols);
    for (const [id, sourceList] of grid.symbols) {
      const symbolList = sourceList
        .filter(
          symbol =>
            symbol.x + origin.x >= 0 &&
            symbol.y + origin.y >= 0 &&
            symbol.x + origin.x < this.width &&
            symbol.y + origin.y < this.height
        )
        .map(symbol =>
          symbol.copyWith({ x: symbol.x + origin.x, y: symbol.y + origin.y })
        );
      if (symbols.has(id)) {
        const newList = [
          ...symbols
            .get(id)!
            .filter(
              symbol =>
                symbol.x < origin.x ||
                symbol.y < origin.y ||
                symbol.x >= origin.x + grid.width ||
                symbol.y >= origin.y + grid.height
            ),
          ...symbolList,
        ];
        if (newList.length > 0) symbols.set(id, newList);
        else symbols.delete(id);
      } else if (symbolList.length > 0) {
        symbols.set(id, symbolList);
      }
    }
    for (const id of [...symbols.keys()]) {
      if (grid.symbols.has(id)) continue;
      const newList = symbols
        .get(id)!
        .filter(
          symbol =>
            symbol.x < origin.x ||
            symbol.y < origin.y ||
            symbol.x >= origin.x + grid.width ||
            symbol.y >= origin.y + grid.height
        );
      if (newList.length > 0) symbols.set(id, newList);
      else symbols.delete(id);
    }
    const rules = GridData.deduplicateRules([...this.rules, ...grid.rules]);
    return this.copyWith({
      tiles: newTiles,
      connections,
      zones,
      symbols,
      rules,
    });
  }

  /**
   * Check if this grid is equal to another grid in terms of size and tile colors.
   * Rules, symbols, and connections are not compared.
   *
   * @param grid The grid to compare with.
   * @returns True if the grids are equal in size and tile colors, false otherwise.
   */
  public colorEquals(grid: GridData): boolean {
    return (
      this.width === grid.width &&
      this.height === grid.height &&
      this.tiles.every((row, y) =>
        row.every(
          (tile, x) =>
            (!tile.exists && !grid.getTile(x, y).exists) ||
            tile.color === grid.getTile(x, y).color
        )
      )
    );
  }

  /**
   * Check if this grid is equal to another grid in terms of size, tile colors, connections, symbols, and rules.
   *
   * @param other The grid to compare with.
   * @returns True if the grids are equal, false otherwise.
   */
  public equals(other: GridData): boolean {
    if (this.width !== other.width) return false;
    if (this.height !== other.height) return false;
    if (
      this.tiles.some((row, y) =>
        row.some((tile, x) => !tile.equals(other.getTile(x, y)))
      )
    )
      return false;
    if (!this.connections.equals(other.connections)) return false;
    if (!this.zones.equals(other.zones)) return false;
    if (this.symbols.size !== other.symbols.size) return false;
    for (const [id, symbols] of this.symbols) {
      const otherSymbols = other.symbols.get(id);
      if (!otherSymbols || symbols.length !== otherSymbols.length) return false;
      for (const symbol of symbols) {
        if (!otherSymbols.some(s => symbol.equals(s))) return false;
      }
    }
    if (this.rules.length !== other.rules.length) return false;
    for (const rule of this.rules) {
      if (!other.rules.some(r => rule.equals(r))) return false;
    }
    return true;
  }

  /**
   * Get the count of tiles that satisfy the given conditions.
   * @param exists Whether the tile exists or not.
   * @param fixed Whether the tile is fixed or not. If undefined, the fixed state is ignored.
   * @param color The color of the tile. If undefined, all colors are included.
   * @returns The count of tiles that satisfy the given conditions.
   */
  public getTileCount(exists: boolean, fixed?: boolean, color?: Color) {
    let count = 0;
    this.forEach(tile => {
      if (tile.exists !== exists) return;
      if (fixed !== undefined && tile.fixed !== fixed) return;
      if (color !== undefined && tile.color !== color) return;
      count++;
    });
    return count;
  }

  /**
   * Get the count of tiles that satisfy the given conditions for each color.
   * @param color The color of the tiles.
   * @returns The count of tiles that satisfy the given conditions for each color.
   */
  public getColorCount(color: Color) {
    let min = 0;
    let max = this.width * this.height;
    this.forEach(tile => {
      if (!tile.exists || (tile.fixed && tile.color !== color)) {
        max--;
      }
      if (tile.exists && tile.fixed && tile.color === color) {
        min++;
      }
    });
    return { min, max };
  }

  /**
   * Deduplicate the rules in the given list.
   *
   * @param rules The list of rules to deduplicate.
   * @returns The deduplicated list of rules.
   */
  public static deduplicateRules(rules: readonly Rule[]): Rule[] {
    return rules.filter(
      (rule, index, self) => self.findIndex(r => r.equals(rule)) === index
    );
  }

  /**
   * Deduplicate the singleton rules in the given list.
   *
   * @param rules The list of rules to deduplicate.
   * @returns The deduplicated list of rules.
   */
  public static deduplicateSingletonRules(rules: readonly Rule[]): Rule[] {
    return rules.filter(
      (rule, index, self) =>
        !rule.isSingleton || self.findIndex(r => r.id === rule.id) === index
    );
  }

  /**
   * Deduplicate the symbols in the given map.
   *
   * @param symbols The map of symbols to deduplicate.
   * @returns The deduplicated map of symbols.
   */
  public static deduplicateSymbols(
    symbols: ReadonlyMap<string, readonly Symbol[]>
  ): Map<string, Symbol[]> {
    const map = new Map<string, Symbol[]>();
    for (const [id, symbolList] of symbols) {
      map.set(
        id,
        symbolList.filter(
          (symbol, index, self) =>
            self.findIndex(s => symbol.equals(s)) === index
        )
      );
    }
    return map;
  }
}
