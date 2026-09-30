import BreakBannedPattern from './breakBannedPattern.js';
import CompleteAreaNumber from './completeAreaNumber.js';
import CompleteDart from './completeDart.js';
import CompleteGalaxy from './completeGalaxy.js';
import CompleteLotus from './completeLotus.js';
import CompleteSubtileSymbol from './completeSubtileSymbol.js';
import CompleteViewpoint from './completeViewpoint.js';
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
import ColorConnectedRegions from './colorConnectedRegions.js';
import ConnectSameLetters from './connectSameLetters.js';
import DisconnectDifferentLetters from './disconnectDifferentLetters.js';
import ForcedRegionExpansion from './forcedRegionExpansion.js';
import SpeculativeSolve from './speculativeSolve.js';

const allLemmas: readonly InsightLemma[] = [
  new CompleteSubtileSymbol(),
  new OffByXAreaNumberConstrainedByRegionSize(),
  new BreakBannedPattern(),
  new ConnectAllCells(),
  new ConnectAllRemovesDisconnectedRegions(),
  new ImpossibleAreaNumberColor(),
  new CompleteGalaxy(),
  new CompleteLotus(),
  new DisconnectIncompatibleRegionSizes(),
  new DisconnectIncompatibleSymmetries(),
  new ConnectSameLetters(),
  new DisconnectDifferentLetters(),
  new ColorConnectedRegions(),
  new ColorDisconnectedRegions(),
  new ConnectThroughBottleneck(),
  new SeparateDisconnectedRegions(),
  new CompleteViewpoint(),
  new CompleteDart(),
  new CompleteAreaNumber(),
  new ForcedRegionExpansion(),
  new SpeculativeSolve(),
];

export default allLemmas;
