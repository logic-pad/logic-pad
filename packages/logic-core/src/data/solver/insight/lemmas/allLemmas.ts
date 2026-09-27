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
import DisconnectIncompatibleRegionSizes from './disconnectIncompatibleRegionSizes.js';
import DisconnectIncompatibleSymmetries from './disconnectIncompatibleSymmetries.js';
import SeparateDisconnectedRegions from './separateDisconnectedRegions.js';
import ColorDisconnectedRegions from './colorDisconnectedRegions.js';
import ForcedRegionExpansion from './forcedRegionExpansion.js';

const allLemmas: readonly InsightLemma[] = [
  new CompleteSubtileSymbol(),
  new OffByXAreaNumberConstrainedByRegionSize(),
  new BreakBannedPattern(),
  new ConnectAllCells(),
  new ConnectAllRemovesDisconnectedRegions(),
  new ImpossibleAreaNumberColor(),
  new CompleteAreaNumber(),
  new CompleteGalaxy(),
  new DisconnectIncompatibleRegionSizes(),
  new DisconnectIncompatibleSymmetries(),
  new ColorDisconnectedRegions(),
  new SeparateDisconnectedRegions(),
  new ForcedRegionExpansion(),
  new ConnectThroughBottleneck(),
];

export default allLemmas;
