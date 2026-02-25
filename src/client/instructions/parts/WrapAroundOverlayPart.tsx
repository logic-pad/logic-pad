import { PartPlacement, PartSpec } from './types.ts';
import { memo, useEffect, useMemo, useState } from 'react';
import WrapAroundRule, {
  instance as wrapAroundInstance,
} from '@logic-pad/core/data/rules/wrapAroundRule';
import GridOverlay from '../../grid/GridOverlay.tsx';
import { useGrid } from '../../contexts/GridContext.tsx';
import Grid from '../../grid/Grid.tsx';
import { computeTileSize } from '../../grid/MainGrid.tsx';
import { useDisplay } from '../../contexts/DisplayContext.tsx';
import { array } from '@logic-pad/core/data/dataHelper';
import GridZones from '@logic-pad/core/data/gridZones';
import GridData from '@logic-pad/core/data/grid';
import { State, Wrapping } from '@logic-pad/core/data/primitives';
import GridConnections from '@logic-pad/core/data/gridConnections';
import { cn } from '../../uiHelper.ts';
import SymbolOverlay from '../../grid/SymbolOverlay.tsx';
import GridZoneOverlay from '../../grid/GridZoneOverlay.tsx';
import { useSettings } from '../../contexts/SettingsContext.tsx';
import { useGridState } from '../../contexts/GridStateContext.tsx';

interface WrapAroundOverlayPartProps {
  instruction: WrapAroundRule;
}

function getLeftEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    tiles: array(1, grid.height, (_, y) => grid.getTile(grid.width - 1, y)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(e => e.x1 === grid.width - 1 || e.x2 === grid.width - 1)
        .map(e => ({
          x1: e.x1 - grid.width + 1,
          y1: e.y1,
          x2: e.x2 - grid.width + 1,
          y2: e.y2,
        }))
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v
            .filter((s, idx) => {
              if (Math.abs(s.x - grid.width + 1) <= 0.5) {
                stateMap.push(idx);
                return true;
              }
              return false;
            })
            .map(s => s.withX(s.x - grid.width + 1)),
        ] as const;
        symbolStateMap.set(k, stateMap);
        return newSymbols;
      })
    ),
    rules: [],
    zones: new GridZones(
      grid.zones.edges
        .filter(e => e.x1 === grid.width - 1 || e.x2 === grid.width - 1)
        .map(e => ({
          x1: e.x1 - grid.width + 1,
          y1: e.y1,
          x2: e.x2 - grid.width + 1,
          y2: e.y2,
        }))
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getRightEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    tiles: array(1, grid.height, (_, y) => grid.getTile(0, y)),
    connections: new GridConnections(
      grid.connections.edges.filter(e => e.x1 === 0 || e.x2 === 0)
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v.filter((s, idx) => {
            if (Math.abs(s.x) <= 0.5) {
              stateMap.push(idx);
              return true;
            }
            return false;
          }),
        ] as const;
        symbolStateMap.set(k, stateMap);
        return newSymbols;
      })
    ),
    rules: [],
    zones: new GridZones(
      grid.zones.edges.filter(e => e.x1 === 0 || e.x2 === 0)
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getTopEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    height: 1,
    tiles: array(grid.width, 1, (x, _) => grid.getTile(x, grid.height - 1)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(e => e.y1 === grid.height - 1 || e.y1 === grid.height - 1)
        .map(e => ({
          x1: e.x1,
          y1: e.y1 - grid.height + 1,
          x2: e.x2,
          y2: e.y2 - grid.height + 1,
        }))
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v
            .filter((s, idx) => {
              if (Math.abs(s.y - grid.height + 1) < 0.5) {
                stateMap.push(idx);
                return true;
              }
              return false;
            })
            .map(s => s.withY(s.y - grid.height + 1)),
        ] as const;
        symbolStateMap.set(k, stateMap);
        return newSymbols;
      })
    ),
    rules: [],
    zones: new GridZones(
      grid.zones.edges
        .filter(e => e.y1 === grid.height - 1 || e.y1 === grid.height - 1)
        .map(e => ({
          x1: e.x1,
          y1: e.y1 - grid.height + 1,
          x2: e.x2,
          y2: e.y2 - grid.height + 1,
        }))
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getBottomEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    height: 1,
    tiles: array(grid.width, 1, (x, _) => grid.getTile(x, 0)),
    connections: new GridConnections(
      grid.connections.edges.filter(e => e.y1 === 0 || e.y1 === 0)
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v.filter((s, idx) => {
            if (Math.abs(s.y) < 0.5) {
              stateMap.push(idx);
              return true;
            }
            return false;
          }),
        ] as const;
        symbolStateMap.set(k, stateMap);
        return newSymbols;
      })
    ),
    rules: [],
    zones: new GridZones(
      grid.zones.edges.filter(e => e.y1 === 0 || e.y1 === 0)
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

export default memo(function WrapAroundOverlayPart({
  instruction,
}: WrapAroundOverlayPartProps) {
  const { grid } = useGrid();
  const { state } = useGridState();
  const { scale, responsiveScale } = useDisplay();
  const [visualizeWrapArounds] = useSettings('visualizeWrapArounds');
  const leftGrid = useMemo(() => {
    if (instruction.horizontal === Wrapping.None)
      return { grid, symbolStateMap: undefined };
    return instruction.horizontal === Wrapping.Wrap ||
      instruction.horizontal === Wrapping.WrapReverse
      ? getLeftEdge(grid)
      : getRightEdge(grid);
  }, [grid, instruction]);
  const leftState = useMemo(() => {
    if (leftGrid.symbolStateMap === undefined) return undefined;
    const newState = new Map<string, State[]>();
    for (const [k, v] of state.symbols.entries()) {
      const stateMap = leftGrid.symbolStateMap.get(k);
      if (!stateMap) continue;
      newState.set(
        k,
        stateMap.map(i => v[i])
      );
    }
    return newState;
  }, [state, leftGrid.symbolStateMap]);
  const rightGrid = useMemo(() => {
    if (instruction.horizontal === Wrapping.None)
      return { grid, symbolStateMap: undefined };
    return instruction.horizontal === Wrapping.Wrap ||
      instruction.horizontal === Wrapping.WrapReverse
      ? getRightEdge(grid)
      : getLeftEdge(grid);
  }, [grid, instruction]);
  const rightState = useMemo(() => {
    if (rightGrid.symbolStateMap === undefined) return undefined;
    const newState = new Map<string, State[]>();
    for (const [k, v] of state.symbols.entries()) {
      const stateMap = rightGrid.symbolStateMap.get(k);
      if (!stateMap) continue;
      newState.set(
        k,
        stateMap.map(i => v[i])
      );
    }
    return newState;
  }, [state, rightGrid.symbolStateMap]);
  const topGrid = useMemo(() => {
    if (instruction.vertical === Wrapping.None)
      return { grid, symbolStateMap: undefined };
    return instruction.vertical === Wrapping.Wrap ||
      instruction.vertical === Wrapping.WrapReverse
      ? getTopEdge(grid)
      : getBottomEdge(grid);
  }, [grid, instruction]);
  const topState = useMemo(() => {
    if (topGrid.symbolStateMap === undefined) return undefined;
    const newState = new Map<string, State[]>();
    for (const [k, v] of state.symbols.entries()) {
      const stateMap = topGrid.symbolStateMap.get(k);
      if (!stateMap) continue;
      newState.set(
        k,
        stateMap.map(i => v[i])
      );
    }
    return newState;
  }, [state, topGrid.symbolStateMap]);
  const bottomGrid = useMemo(() => {
    if (instruction.vertical === Wrapping.None)
      return { grid, symbolStateMap: undefined };
    return instruction.vertical === Wrapping.Wrap ||
      instruction.vertical === Wrapping.WrapReverse
      ? getBottomEdge(grid)
      : getTopEdge(grid);
  }, [grid, instruction]);
  const bottomState = useMemo(() => {
    if (bottomGrid.symbolStateMap === undefined) return undefined;
    const newState = new Map<string, State[]>();
    for (const [k, v] of state.symbols.entries()) {
      const stateMap = bottomGrid.symbolStateMap.get(k);
      if (!stateMap) continue;
      newState.set(
        k,
        stateMap.map(i => v[i])
      );
    }
    return newState;
  }, [state, bottomGrid.symbolStateMap]);

  const [tileConfig, setTileConfig] = useState<{
    width: number;
    height: number;
    tileSize: number;
  }>({ width: 0, height: 0, tileSize: 0 });
  useEffect(() => {
    const resizeHandler = () =>
      setTileConfig({
        width: grid.width,
        height: grid.height,
        tileSize: computeTileSize(grid, responsiveScale, true),
      });
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [grid, responsiveScale]);
  if (!visualizeWrapArounds) return null;
  if (
    tileConfig.tileSize === 0 ||
    tileConfig.width !== grid.width ||
    tileConfig.height !== grid.height
  )
    return null;

  return (
    <GridOverlay>
      {instruction.horizontal !== Wrapping.None && (
        <>
          <div
            className={cn(
              'absolute right-[calc(100%-0.5em)] -top-[0.5em] w-[1.5em] h-[calc(100%+1em)] mask-fade-l',
              (instruction.horizontal === Wrapping.WrapReverse ||
                instruction.horizontal === Wrapping.ReflectReverse) &&
                '-scale-y-100'
            )}
          >
            <Grid
              grid={leftGrid.grid}
              size={Math.round(tileConfig.tileSize * scale)}
              editable={false}
              className={cn(
                'absolute right-[0.5em] top-[0.5em]',
                instruction.horizontal === Wrapping.ReflectReverse &&
                  '-scale-x-100'
              )}
            >
              <SymbolOverlay
                grid={leftGrid.grid}
                state={leftState}
                solution={null}
                editable={false}
              />
              <GridZoneOverlay grid={leftGrid.grid} />
            </Grid>
          </div>
          <div
            className={cn(
              'absolute left-[calc(100%-0.5em)] -top-[0.5em] w-[1.5em] h-[calc(100%+1em)] mask-fade-r',
              (instruction.horizontal === Wrapping.WrapReverse ||
                instruction.horizontal === Wrapping.ReflectReverse) &&
                '-scale-y-100'
            )}
          >
            <Grid
              grid={rightGrid.grid}
              size={Math.round(tileConfig.tileSize * scale)}
              editable={false}
              className={cn(
                'absolute left-[0.5em] top-[0.5em]',
                instruction.horizontal === Wrapping.ReflectReverse &&
                  '-scale-x-100'
              )}
            >
              <SymbolOverlay
                grid={rightGrid.grid}
                state={rightState}
                solution={null}
                editable={false}
              />
              <GridZoneOverlay grid={rightGrid.grid} />
            </Grid>
          </div>
        </>
      )}
      {instruction.vertical !== Wrapping.None && (
        <>
          <div
            className={cn(
              'absolute bottom-[calc(100%-0.5em)] -left-[0.5em] w-[calc(100%+1em)] h-[1.5em] mask-fade-t',
              (instruction.vertical === Wrapping.WrapReverse ||
                instruction.vertical === Wrapping.ReflectReverse) &&
                '-scale-x-100'
            )}
          >
            <Grid
              grid={topGrid.grid}
              size={Math.round(tileConfig.tileSize * scale)}
              editable={false}
              className={cn(
                'absolute left-[0.5em] bottom-[0.5em]',
                instruction.vertical === Wrapping.ReflectReverse &&
                  '-scale-y-100'
              )}
            >
              <SymbolOverlay
                grid={topGrid.grid}
                state={topState}
                solution={null}
                editable={false}
              />
              <GridZoneOverlay grid={topGrid.grid} />
            </Grid>
          </div>
          <div
            className={cn(
              'absolute top-[calc(100%-0.5em)] -left-[0.5em] w-[calc(100%+1em)] h-[1.5em] mask-fade-b',
              (instruction.vertical === Wrapping.WrapReverse ||
                instruction.vertical === Wrapping.ReflectReverse) &&
                '-scale-x-100'
            )}
          >
            <Grid
              grid={bottomGrid.grid}
              size={Math.round(tileConfig.tileSize * scale)}
              editable={false}
              className={cn(
                'absolute left-[0.5em] top-[0.5em]',
                instruction.vertical === Wrapping.ReflectReverse &&
                  '-scale-y-100'
              )}
            >
              <SymbolOverlay
                grid={bottomGrid.grid}
                state={bottomState}
                solution={null}
                editable={false}
              />
              <GridZoneOverlay grid={bottomGrid.grid} />
            </Grid>
          </div>
        </>
      )}
    </GridOverlay>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.MainGridOverlay,
  instructionId: wrapAroundInstance.id,
};
