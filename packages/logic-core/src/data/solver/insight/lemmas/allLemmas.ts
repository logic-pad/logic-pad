import BreakBannedPattern from './breakBannedPattern.js';
import CompleteAreaNumber from './completeAreaNumber.js';
import CompleteGalaxy from './completeGalaxy.js';
import CompleteSubtileSymbol from './completeSubtileSymbol.js';
import ConnectAllCells from './connectAllCells.js';
import ConnectAllRemovesDisconnectedRegions from './connectAllRemovesDisconnectedRegions.js';
import ConnectThroughBottleneck from './connectThroughBottleneck.js';
import ImpossibleAreaNumberColor from './impossibleAreaNumberColor.js';
import InsightLemma from './insightLemma.js';
import OffByXAreaNumberConstrainedByRegionSize from './offByXAreaNumberConstrainedByRegionSize.js';
import DisconnectIncompatibleSymmetries from './disconnectIncompatibleSymmetries.js';
import SeparateDisconnectedRegions from './separateDisconnectedRegions.js';
import ColorDisconnectedRegions from './colorDisconnectedRegions.js';

const allLemmas: readonly InsightLemma[] = [
  new CompleteSubtileSymbol(),
  new OffByXAreaNumberConstrainedByRegionSize(),
  new BreakBannedPattern(),
  new ConnectAllCells(),
  new ConnectAllRemovesDisconnectedRegions(),
  new ImpossibleAreaNumberColor(),
  new CompleteAreaNumber(),
  new CompleteGalaxy(),
  new DisconnectIncompatibleSymmetries(),
  new ColorDisconnectedRegions(),
  new SeparateDisconnectedRegions(),
  new ConnectThroughBottleneck(),
];

export default allLemmas;
