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
import {
  OrientationMap,
  ORIENTATIONS,
  State,
  Wrapping,
} from '@logic-pad/core/data/primitives';
import GridConnections from '@logic-pad/core/data/gridConnections';
import { cn } from '../../uiHelper.ts';
import SymbolOverlay from '../../grid/SymbolOverlay.tsx';
import GridZoneOverlay from '../../grid/GridZoneOverlay.tsx';
import { useSettings } from '../../contexts/SettingsContext.tsx';
import { useGridState } from '../../contexts/GridStateContext.tsx';

interface WrapAroundOverlayPartProps {
  instruction: WrapAroundRule;
}

interface ExtensionGrid {
  grid: GridData;
  symbolStateMap: Map<string, number[]>;
}

// todo: same symbol overlap in reverse wrap/reflect

function isWrap(wrapping: Wrapping) {
  return wrapping === Wrapping.Wrap || wrapping === Wrapping.WrapReverse;
}

function isReverse(wrapping: Wrapping) {
  return (
    wrapping === Wrapping.WrapReverse || wrapping === Wrapping.ReflectReverse
  );
}

function isReflectReverse(wrapping: Wrapping) {
  return wrapping === Wrapping.ReflectReverse;
}

function isNone(wrapping: Wrapping) {
  return wrapping === Wrapping.None;
}

function getRightEdge(grid: GridData) {
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
              if (grid.width - 1 - s.x < 0.5) {
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

function getLeftEdge(grid: GridData) {
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
            if (s.x < 0.5) {
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

function getBottomEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    height: 1,
    tiles: array(grid.width, 1, (x, _) => grid.getTile(x, grid.height - 1)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(e => e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
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
              if (grid.height - 1 - s.y < 0.5) {
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
        .filter(e => e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
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

function getTopEdge(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    height: 1,
    tiles: array(grid.width, 1, (x, _) => grid.getTile(x, 0)),
    connections: new GridConnections(
      grid.connections.edges.filter(e => e.y1 === 0 || e.y2 === 0)
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v.filter((s, idx) => {
            if (s.y < 0.5) {
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
      grid.zones.edges.filter(e => e.y1 === 0 || e.y2 === 0)
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getTopLeftCorner(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    height: 1,
    tiles: array(1, 1, () => grid.getTile(0, 0)),
    connections: new GridConnections(
      grid.connections.edges.filter(
        e => (e.x1 === 0 || e.x2 === 0) && (e.y1 === 0 || e.y2 === 0)
      )
    ),
    symbols: new Map(
      [...grid.symbols.entries()].map(([k, v]) => {
        const stateMap: number[] = [];
        const newSymbols = [
          k,
          v.filter((s, idx) => {
            if (s.x < 0.5 && s.y < 0.5) {
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
      grid.zones.edges.filter(
        e => (e.x1 === 0 || e.x2 === 0) && (e.y1 === 0 || e.y2 === 0)
      )
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getTopRightCorner(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    height: 1,
    tiles: array(1, 1, () => grid.getTile(grid.width - 1, 0)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(
          e =>
            (e.x1 === grid.width - 1 || e.x2 === grid.width - 1) &&
            (e.y1 === 0 || e.y2 === 0)
        )
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
              if (grid.width - 1 - s.x < 0.5 && s.y < 0.5) {
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
        .filter(
          e =>
            (e.x1 === grid.width - 1 || e.x2 === grid.width - 1) &&
            (e.y1 === 0 || e.y2 === 0)
        )
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

function getBottomLeftCorner(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    height: 1,
    tiles: array(1, 1, () => grid.getTile(0, grid.height - 1)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(
          e =>
            (e.x1 === 0 || e.x2 === 0) &&
            (e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
        )
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
              if (s.x < 0.5 && grid.height - 1 - s.y < 0.5) {
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
        .filter(
          e =>
            (e.x1 === 0 || e.x2 === 0) &&
            (e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
        )
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

function getBottomRightCorner(grid: GridData) {
  const symbolStateMap = new Map<string, number[]>();
  const newGrid = grid.copyWith({
    width: 1,
    height: 1,
    tiles: array(1, 1, () => grid.getTile(grid.width - 1, grid.height - 1)),
    connections: new GridConnections(
      grid.connections.edges
        .filter(
          e =>
            (e.x1 === grid.width - 1 || e.x2 === grid.width - 1) &&
            (e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
        )
        .map(e => ({
          x1: e.x1 - grid.width + 1,
          y1: e.y1 - grid.height + 1,
          x2: e.x2 - grid.width + 1,
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
              if (grid.width - 1 - s.x < 0.5 && grid.height - 1 - s.y < 0.5) {
                stateMap.push(idx);
                return true;
              }
              return false;
            })
            .map(s =>
              s.copyWith({ x: s.x - grid.width + 1, y: s.y - grid.height + 1 })
            ),
        ] as const;
        symbolStateMap.set(k, stateMap);
        return newSymbols;
      })
    ),
    rules: [],
    zones: new GridZones(
      grid.zones.edges
        .filter(
          e =>
            (e.x1 === grid.width - 1 || e.x2 === grid.width - 1) &&
            (e.y1 === grid.height - 1 || e.y2 === grid.height - 1)
        )
        .map(e => ({
          x1: e.x1 - grid.width + 1,
          y1: e.y1 - grid.height + 1,
          x2: e.x2 - grid.width + 1,
          y2: e.y2 - grid.height + 1,
        }))
    ),
  });
  return {
    grid: newGrid,
    symbolStateMap,
  };
}

function getCorner(grid: GridData, bottom: boolean, right: boolean) {
  if (bottom && right) return getBottomRightCorner(grid);
  if (bottom && !right) return getBottomLeftCorner(grid);
  if (!bottom && right) return getTopRightCorner(grid);
  return getTopLeftCorner(grid);
}

function getWrappedCorner(
  instruction: WrapAroundRule,
  grid: GridData,
  bottom: boolean,
  right: boolean
) {
  switch (instruction.horizontal) {
    case Wrapping.WrapReverse:
      bottom = !bottom;
      break;
    case Wrapping.ReflectReverse:
      right = !right;
      bottom = !bottom;
      break;
  }
  switch (instruction.vertical) {
    case Wrapping.WrapReverse:
      right = !right;
      break;
    case Wrapping.ReflectReverse:
      right = !right;
      bottom = !bottom;
      break;
  }
  return getCorner(grid, bottom, right);
}

function getExtensionGrids(
  grid: GridData,
  instruction: WrapAroundRule
): OrientationMap<ExtensionGrid | undefined> {
  return {
    left: isNone(instruction.horizontal)
      ? undefined
      : isWrap(instruction.horizontal)
        ? getRightEdge(grid)
        : getLeftEdge(grid),
    right: isNone(instruction.horizontal)
      ? undefined
      : isWrap(instruction.horizontal)
        ? getLeftEdge(grid)
        : getRightEdge(grid),
    up: isNone(instruction.vertical)
      ? undefined
      : isWrap(instruction.vertical)
        ? getBottomEdge(grid)
        : getTopEdge(grid),
    down: isNone(instruction.vertical)
      ? undefined
      : isWrap(instruction.vertical)
        ? getTopEdge(grid)
        : getBottomEdge(grid),
    'up-left':
      isNone(instruction.horizontal) || isNone(instruction.vertical)
        ? undefined
        : getWrappedCorner(instruction, grid, true, true),
    'up-right':
      isNone(instruction.horizontal) || isNone(instruction.vertical)
        ? undefined
        : getWrappedCorner(instruction, grid, true, false),
    'down-left':
      isNone(instruction.horizontal) || isNone(instruction.vertical)
        ? undefined
        : getWrappedCorner(instruction, grid, false, true),
    'down-right':
      isNone(instruction.horizontal) || isNone(instruction.vertical)
        ? undefined
        : getWrappedCorner(instruction, grid, false, false),
  };
}

function getExtensionStates(
  state: ReadonlyMap<string, State[]>,
  extensionGrids: OrientationMap<ExtensionGrid | undefined>
): OrientationMap<Map<string, State[]> | undefined> {
  const result: OrientationMap<Map<string, State[]> | undefined> = {
    left: undefined,
    right: undefined,
    up: undefined,
    down: undefined,
    'down-left': undefined,
    'down-right': undefined,
    'up-left': undefined,
    'up-right': undefined,
  };
  for (const orientation of ORIENTATIONS) {
    const extensionGrid = extensionGrids[orientation];
    if (!extensionGrid) continue;
    const symbolStateMap = extensionGrid.symbolStateMap;
    const newState = new Map<string, State[]>();
    for (const [k, v] of state.entries()) {
      const stateMap = symbolStateMap.get(k);
      if (!stateMap) continue;
      newState.set(
        k,
        stateMap.map(i => v[i])
      );
    }
    result[orientation] = newState;
  }
  return result;
}

const GridExtension = memo(function GridExtension({
  grid,
  symbolState,
  tileSize,
  wrapperClassName,
  gridClassName,
}: {
  grid: GridData;
  symbolState: Map<string, State[]> | undefined;
  tileSize: number;
  wrapperClassName?: string;
  gridClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      <Grid
        grid={grid}
        size={tileSize}
        editable={false}
        className={gridClassName}
      >
        <SymbolOverlay
          grid={grid}
          state={symbolState}
          solution={null}
          editable={false}
        />
        <GridZoneOverlay grid={grid} />
      </Grid>
    </div>
  );
});

export default memo(function WrapAroundOverlayPart({
  instruction,
}: WrapAroundOverlayPartProps) {
  const { grid } = useGrid();
  const { state } = useGridState();
  const { scale, responsiveScale } = useDisplay();
  const [visualizeWrapArounds] = useSettings('visualizeWrapArounds');
  const extensions = useMemo(
    () => getExtensionGrids(grid, instruction),
    [grid, instruction]
  );
  const states = useMemo(
    () => getExtensionStates(state.symbols, extensions),
    [state.symbols, extensions]
  );

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
      {extensions.left && (
        <GridExtension
          grid={extensions.left.grid}
          symbolState={states.left}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute right-[calc(100%-0.5em)] -top-[0.5em] w-[1.5em] h-[calc(100%+1em)] mask-fade-l',
            isReverse(instruction.horizontal) && '-scale-y-100'
          )}
          gridClassName={cn(
            'absolute right-[0.5em] top-[0.5em]',
            isReflectReverse(instruction.horizontal) && '-scale-x-100'
          )}
        />
      )}
      {extensions.right && (
        <GridExtension
          grid={extensions.right.grid}
          symbolState={states.right}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute left-[calc(100%-0.5em)] -top-[0.5em] w-[1.5em] h-[calc(100%+1em)] mask-fade-r',
            isReverse(instruction.horizontal) && '-scale-y-100'
          )}
          gridClassName={cn(
            'absolute left-[0.5em] top-[0.5em]',
            isReflectReverse(instruction.horizontal) && '-scale-x-100'
          )}
        />
      )}
      {extensions.up && (
        <GridExtension
          grid={extensions.up.grid}
          symbolState={states.up}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute bottom-[calc(100%-0.5em)] -left-[0.5em] w-[calc(100%+1em)] h-[1.5em] mask-fade-t',
            isReverse(instruction.vertical) && '-scale-x-100'
          )}
          gridClassName={cn(
            'absolute left-[0.5em] bottom-[0.5em]',
            isReflectReverse(instruction.vertical) && '-scale-y-100'
          )}
        />
      )}
      {extensions.down && (
        <GridExtension
          grid={extensions.down.grid}
          symbolState={states.down}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute top-[calc(100%-0.5em)] -left-[0.5em] w-[calc(100%+1em)] h-[1.5em] mask-fade-b',
            isReverse(instruction.vertical) && '-scale-x-100'
          )}
          gridClassName={cn(
            'absolute left-[0.5em] top-[0.5em]',
            isReflectReverse(instruction.vertical) && '-scale-y-100'
          )}
        />
      )}
      {extensions['up-left'] && (
        <GridExtension
          grid={extensions['up-left'].grid}
          symbolState={states['up-left']}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute -left-[1em] -top-[1em] w-[1.5em] h-[1.5em] mask-fade-tl'
          )}
          gridClassName={cn(
            'absolute left-0 top-0',
            ((instruction.horizontal === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-y-100',
            ((instruction.vertical === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-x-100'
          )}
        />
      )}
      {extensions['up-right'] && (
        <GridExtension
          grid={extensions['up-right'].grid}
          symbolState={states['up-right']}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute -right-[1em] -top-[1em] w-[1.5em] h-[1.5em] mask-fade-tr'
          )}
          gridClassName={cn(
            'absolute right-0 top-0',
            ((instruction.horizontal === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-y-100',
            ((instruction.vertical === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-x-100'
          )}
        />
      )}
      {extensions['down-left'] && (
        <GridExtension
          grid={extensions['down-left'].grid}
          symbolState={states['down-left']}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute -left-[1em] -bottom-[1em] w-[1.5em] h-[1.5em] mask-fade-bl'
          )}
          gridClassName={cn(
            'absolute left-0 bottom-0',
            ((instruction.horizontal === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-y-100',
            ((instruction.vertical === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-x-100'
          )}
        />
      )}
      {extensions['down-right'] && (
        <GridExtension
          grid={extensions['down-right'].grid}
          symbolState={states['down-right']}
          tileSize={Math.round(tileConfig.tileSize * scale)}
          wrapperClassName={cn(
            'absolute -right-[1em] -bottom-[1em] w-[1.5em] h-[1.5em] mask-fade-br'
          )}
          gridClassName={cn(
            'absolute right-0 bottom-0',
            ((instruction.horizontal === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-y-100',
            ((instruction.vertical === Wrapping.WrapReverse) !==
              (instruction.horizontal === Wrapping.ReflectReverse)) !==
              (instruction.vertical === Wrapping.ReflectReverse) &&
              '-scale-x-100'
          )}
        />
      )}
    </GridOverlay>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.MainGridOverlay,
  instructionId: wrapAroundInstance.id,
};
