import { Serializer } from '../../serializer/allSerializers.js';
import GridData from '../../grid.js';
import { instance as undercluedInstance } from '../../rules/undercluedRule.js';
import validateGrid from '../../validate.js';
import { State } from '../../primitives.js';
import { Lemma } from './lemmaUtils.js';
import { AreaNumberHasRightSize } from './lemmas/AreaNumberHasRightSize.js';
import { AreaNumberHasExactAvailability } from './lemmas/AreaNumberHasExactAvailability.js';
import { AreaNumberImpossibleSymbolColor } from './lemmas/AreaNumberImpossibleSymbolColor.js';

const allLemmas: Lemma[] = [
  new AreaNumberHasRightSize(),
  new AreaNumberHasExactAvailability(),
  new AreaNumberImpossibleSymbolColor(),
];

function getAvailableLemmas(grid: GridData): Lemma[] {
  return allLemmas
    .filter(lemma => {
      return lemma.isApplicable(grid);
    })
    .sort((a, b) => a.score - b.score);
}

function solveNormal(
  input: GridData,
  submitSolution: (grid: GridData | null) => boolean
) {
  let isValid = validateGrid(input, null);

  if (isValid.final === State.Error) {
    return;
  }

  const availableLemmas = getAvailableLemmas(input);
  let applyingLemma: Lemma | null = null;
  let applied = false;
  const appliedLemmas: Lemma[] = [];
  while (isValid.final === State.Incomplete) {
    applyingLemma = null;
    for (const lemma of availableLemmas) {
      [applied, input] = lemma.apply(input);
      if (applied) {
        applyingLemma = lemma;
        break;
      }
    }
    if (!applyingLemma) {
      break; // No more lemmas to apply // TODO : find a way to handle no available lemmas
    }
    console.log(`Applied lemma ${applyingLemma.id}`);
    appliedLemmas.push(applyingLemma);
    isValid = validateGrid(input, null);
  }
  console.log(
    'Total score: ',
    appliedLemmas.reduce((acc, lemma) => acc + lemma.score, 0)
  );
  submitSolution(isValid.final !== State.Error ? input : null);
}

function solve(
  grid: GridData,
  submitSolution: (grid: GridData | null) => boolean
) {
  if (grid.findRule(rule => rule.id === undercluedInstance.id)) {
    // Will not support underclued because of the way the solver works
    submitSolution(null);
  } else {
    solveNormal(grid, submitSolution);
  }
}

onmessage = e => {
  const grid = Serializer.parseGrid(e.data as string);

  let count = 0;

  solve(grid, solution => {
    if (solution) {
      if (solution.resetTiles().colorEquals(solution)) {
        solution = null;
      }
    }
    postMessage(solution ? Serializer.stringifyGrid(solution) : null);

    count += 1;
    return count < 2;
  });

  postMessage(null);
};

export {};
