import GridData, { NEIGHBOR_OFFSETS } from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../../symbols/areaNumberSymbol.js';
import RegionAreaRule, {
  instance as regionAreaInstance,
} from '../../../rules/regionAreaRule.js';
import { cell, modifyTiles, setColor, setOppositeColor } from '../helper.js';
import { Color, Position } from '../../../primitives.js';

const COLORS = [Color.Dark, Color.Light] as const;

interface Check {
  position: Position;
  targets: Position[];
  colors: Color[];
  subject: string;
}

/**
 * Colors a gray cell when one of its hypothetical colors would leave the region containing it
 * with no satisfiable size. Sizes come from the region size store, so both area number symbols
 * and region area size rules are covered:
 *
 * - Every gray cell holding an area number symbol is tested in both colors.
 * - Every other gray merged tile is tested in each color that could matter: a color bounded by a
 *   region area size rule, or a color that would merge the tile into a size-constrained region.
 */
export default class ImpossibleRegionColor extends InsightLemma {
  public readonly id = 'impossible-region-color';

  public isApplicable(grid: GridData): boolean {
    return (
      !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id) ||
      !!grid.findRule(rule => rule.id === regionAreaInstance.id)
    );
  }

  public apply(context: InsightContext): boolean {
    for (const check of this.checks(context)) {
      for (const color of check.colors) {
        if (this.impossibleColor(context, check, color)) return true;
      }
    }
    return false;
  }

  private checks(context: InsightContext): Check[] {
    const grid = context.grid;
    const checks: Check[] = [];
    const covered = new Set<string>();
    for (const symbol of grid.symbols.get(areaNumberInstance.id) ?? []) {
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const originTile = grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color !== Color.Gray) continue;
      const targets: Position[] = [];
      for (let y = position.y; y <= Math.ceil(symbol.y); y++) {
        for (let x = position.x; x <= Math.ceil(symbol.x); x++) {
          covered.add(`${x},${y}`);
          const tile = grid.getTile(x, y);
          if (tile.exists && !tile.fixed && tile.color === Color.Gray) {
            targets.push({ x, y });
          }
        }
      }
      if (targets.length === 0) continue;
      checks.push({
        position,
        targets,
        colors: [...COLORS],
        subject: `Area number at ${cell(position)}`,
      });
    }
    const ruleColors = new Set(
      grid.rules
        .filter(
          (rule): rule is RegionAreaRule => rule instanceof RegionAreaRule
        )
        .map(rule => rule.color)
    );
    const grouped = new Set<string>();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const key = `${x},${y}`;
        if (covered.has(key) || grouped.has(key)) continue;
        const tile = grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        const connected = grid.connections.getConnectedTiles({ x, y });
        for (const pos of connected) grouped.add(`${pos.x},${pos.y}`);
        if (connected.some(pos => grid.getTile(pos.x, pos.y).fixed)) continue;
        const colors = COLORS.filter(color =>
          this.colorMatters(context, connected, color, ruleColors)
        );
        if (colors.length === 0) continue;
        checks.push({
          position: { x, y },
          targets: [...connected],
          colors,
          subject: `Cell at ${cell({ x, y })}`,
        });
      }
    }
    return checks;
  }

  /**
   * Whether hypothesizing the given tiles as `color` could produce a size contradiction: the
   * color must be bounded by a region area size rule, or the tiles must touch a region that
   * already has size possibilities and could absorb them.
   */
  private colorMatters(
    context: InsightContext,
    tiles: readonly Position[],
    color: Color,
    ruleColors: ReadonlySet<Color>
  ): boolean {
    if (ruleColors.has(color)) return true;
    for (const pos of tiles) {
      for (const offset of NEIGHBOR_OFFSETS) {
        const next = { x: pos.x + offset.x, y: pos.y + offset.y };
        if (!context.grid.isPositionValid(next.x, next.y)) continue;
        const region = context.regions.get(next);
        if (!region) continue;
        if (region.color !== color && region.color !== Color.Gray) continue;
        if (context.regionSizes.getPossibilities(region) === null) continue;
        return true;
      }
    }
    return false;
  }

  private impossibleColor(
    context: InsightContext,
    check: Check,
    color: Color
  ): boolean {
    const grid = context.grid;
    // A merged tile holding a fixed cell of another color cannot take this color at all.
    for (const target of check.targets) {
      for (const pos of grid.connections.getConnectedTiles(target)) {
        const tile = grid.getTile(pos.x, pos.y);
        if (tile.fixed && tile.color !== color) return false;
      }
    }

    const hypothetical = context.copy();
    const hypothesisTiles = modifyTiles(hypothetical.grid);
    for (const target of check.targets) {
      setColor(hypothetical.grid, hypothesisTiles, target.x, target.y, color);
    }
    hypothetical.setTiles(hypothesisTiles);

    const region = hypothetical.regions.get(check.position);
    if (!region) return false;
    const proof = this.proof().difficulty(2);
    const regionMap = region.getRegionMap();
    hypothetical.regions.explainRegion(region, proof);
    const flatMap = regionMap.flat();
    const maxComplete = flatMap.reduce(
      (count, cell) => count + (cell || cell === null ? 1 : 0),
      0
    );
    const minComplete = flatMap.reduce(
      (count, cell) => count + (cell ? 1 : 0),
      0
    );
    const fillOpposite = () => {
      const tiles = modifyTiles(grid);
      for (const target of check.targets) {
        setOppositeColor(grid, tiles, target.x, target.y, color);
      }
      return tiles;
    };
    const possibilities = hypothetical.regionSizes.getPossibilities(
      region,
      proof
    );
    if (possibilities && possibilities.length === 0) {
      const numbers = [
        ...new Set(
          [...region.symbols]
            .filter(
              (symbol): symbol is AreaNumberSymbol =>
                symbol instanceof AreaNumberSymbol
            )
            .map(symbol => symbol.number)
        ),
      ];
      context.setTiles(
        fillOpposite(),
        proof.describe(
          numbers.length > 1
            ? `${check.subject} cannot be ${color} because it would merge area numbers ${numbers.join(' and ')} into one region, which cannot all be satisfied`
            : `${check.subject} cannot be ${color} because that region has no possible size left`
        )
      );
      return true;
    }
    if (!possibilities) return false;
    const minPossible = hypothetical.regionSizes.minPossible(region, proof);
    if (minPossible > maxComplete) {
      context.setTiles(
        fillOpposite(),
        proof.describe(
          `${check.subject} cannot be ${color} because the region must be completed with ${minPossible} cells but there are at most ${maxComplete} ${color} cells in it`
        )
      );
      return true;
    }
    const maxPossible = hypothetical.regionSizes.maxPossible(region, proof);
    if (maxPossible < minComplete) {
      context.setTiles(
        fillOpposite(),
        proof.describe(
          `${check.subject} cannot be ${color} because the region can hold at most ${maxPossible} cells but there are at least ${minComplete} ${color} cells in it`
        )
      );
      return true;
    }
    return false;
  }
}
