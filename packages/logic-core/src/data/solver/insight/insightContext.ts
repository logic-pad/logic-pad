import GridData from '../../grid.js';
import Proof from './types/proof.js';
import NumberSymbolStore from './stores/numberSymbolStore.js';
import RegionStore from './stores/regionStore.js';
import TileData from '../../tile.js';

export interface TileChange {
  oldGrid: GridData;
  newGrid: GridData;
  proof: Proof;
}

/**
 * Central mutable state for insight solving.
 */
export default class InsightContext {
  private _grid: GridData;

  private _tileHistory: TileChange[] = [];

  public constructor(grid: GridData) {
    this._grid = grid;
  }

  /**
   * Current grid state observed by lemmas and stores.
   */
  public get grid(): GridData {
    return this._grid;
  }

  /**
   * History of grid color changes with supporting proofs, ordered from oldest to newest.
   */
  public get tileHistory(): readonly TileChange[] {
    return this._tileHistory;
  }

  /**
   * Updates grid colors and notifies all initialized stores.
   */
  public setTiles(
    newTiles: readonly (readonly TileData[])[],
    proof: Proof
  ): void {
    const oldGrid = this._grid;
    this._grid = this._grid.copyWith({ tiles: newTiles }, false, false);
    this._regionStore?.onGridUpdate();
    this._numberSymbolStore?.onGridUpdate();
    this._tileHistory.push({ oldGrid, newGrid: this._grid, proof });
  }

  private _regionStore?: RegionStore;
  public get regionStore(): Readonly<RegionStore> {
    this._regionStore ??= new RegionStore(this);
    return this._regionStore;
  }

  private _numberSymbolStore?: NumberSymbolStore;
  public get numberSymbolStore(): Readonly<NumberSymbolStore> {
    this._numberSymbolStore ??= new NumberSymbolStore(this);
    return this._numberSymbolStore;
  }
}
