import GridData from '../../grid.js';
import Proof from './types/proof.js';
import RegionSizeStore from './stores/regionSizeStore.js';
import NumberSymbolStore from './stores/numberSymbolStore.js';
import RegionStore from './stores/regionStore.js';
import TileData from '../../tile.js';
import AreaStore from './stores/areaStore.js';

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

  public tileHistory: TileChange[] = [];

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
   * Updates grid colors and notifies all initialized stores.
   */
  public setTiles(
    newTiles: readonly (readonly TileData[])[],
    proof?: Proof
  ): void {
    const oldGrid = this._grid;
    this._grid = this._grid.copyWith({ tiles: newTiles }, false, false);
    this._regionSizes?.onGridUpdate();
    this._numbers?.onGridUpdate();
    this._areas?.onGridUpdate();
    this._regions?.onGridUpdate();
    if (proof) {
      this.tileHistory.push({ oldGrid, newGrid: this._grid, proof });
    }
  }

  public copy(): InsightContext {
    const copy = new InsightContext(this._grid);
    copy.tileHistory = [...this.tileHistory];
    copy._regionSizes = this._regionSizes?.copyWithContext(copy);
    copy._numbers = this._numbers?.copyWithContext(copy);
    copy._areas = this._areas?.copyWithContext(copy);
    copy._regions = this._regions?.copyWithContext(copy);
    return copy;
  }

  private _regionSizes?: RegionSizeStore;
  public get regionSizes(): Readonly<RegionSizeStore> {
    this._regionSizes ??= new RegionSizeStore(this);
    return this._regionSizes;
  }

  private _numbers?: NumberSymbolStore;
  public get numbers(): Readonly<NumberSymbolStore> {
    this._numbers ??= new NumberSymbolStore(this);
    return this._numbers;
  }

  private _areas?: AreaStore;
  public get areas(): Readonly<AreaStore> {
    this._areas ??= new AreaStore(this);
    return this._areas;
  }

  private _regions?: RegionStore;
  public get regions(): Readonly<RegionStore> {
    this._regions ??= new RegionStore(this);
    return this._regions;
  }
}
