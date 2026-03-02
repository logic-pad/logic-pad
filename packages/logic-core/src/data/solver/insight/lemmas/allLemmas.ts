import CompleteAreaNumber from './completeAreaNumber.js';
import InsightLemma from './insightLemma.js';
import OffByXAreaNumberConstrainedByRegionSize from './offByXAreaNumberConstrainedByRegionSize.js';

const allLemmas: readonly InsightLemma[] = [
  new OffByXAreaNumberConstrainedByRegionSize(),
  new CompleteAreaNumber(),
];

export default allLemmas;
