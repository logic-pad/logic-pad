import BreakBannedPattern from './breakBannedPattern.js';
import CompleteAreaNumber from './completeAreaNumber.js';
import CompleteSubtileSymbol from './completeSubtileSymbol.js';
import ConnectAllCells from './connectAllCells.js';
import ConnectAllRemovesDisconnectedRegions from './connectAllRemovesDisconnectedRegions.js';
import ConnectThroughBottleneck from './connectThroughBottleneck.js';
import ImpossibleAreaNumberColor from './impossibleAreaNumberColor.js';
import InsightLemma from './insightLemma.js';
import OffByXAreaNumberConstrainedByRegionSize from './offByXAreaNumberConstrainedByRegionSize.js';

const allLemmas: readonly InsightLemma[] = [
  new CompleteSubtileSymbol(),
  new OffByXAreaNumberConstrainedByRegionSize(),
  new BreakBannedPattern(),
  new ConnectAllCells(),
  new ConnectAllRemovesDisconnectedRegions(),
  new ImpossibleAreaNumberColor(),
  new CompleteAreaNumber(),
  new ConnectThroughBottleneck(),
];

export default allLemmas;
