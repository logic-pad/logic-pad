import { Serializer } from '../../serializer/allSerializers.js';
import { State } from '../../primitives.js';
import validateGrid from '../../validate.js';
import InsightContext from './insightContext.js';
import InsightError from './types/insightError.js';
import allLemmas from './lemmas/allLemmas.js';

onmessage = e => {
  const grid = Serializer.parseGrid(e.data as string);
  const context = new InsightContext(grid);

  const initialValidation = validateGrid(context.grid, null);
  if (initialValidation.final === State.Error) {
    postMessage(null);
    return;
  }
  if (initialValidation.final === State.Satisfied) {
    postMessage(Serializer.stringifyGrid(context.grid));
    return;
  }

  const lemmas = allLemmas.filter(lemma => lemma.isApplicable(context.grid));

  try {
    let restart = true;
    mainLoop: while (restart) {
      restart = false;

      for (const lemma of lemmas) {
        const changed = lemma.apply(context);
        if (changed) {
          console.log(`%c${lemma.id}:\n  successful`, 'color: darkgray');
          context.tileHistory.forEach(history =>
            console.log(history.proof.toString())
          );
          restart = true;
          if (context.tileHistory.length > 0) {
            break mainLoop;
          } else {
            break;
          }
        } else {
          console.log(`%c${lemma.id}:\n  no changes`, 'color: darkgray');
        }
      }
    }
  } catch (error) {
    if (error instanceof InsightError) {
      console.error(`Error in ${error.source}: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    postMessage(undefined);
    return;
  }

  postMessage(Serializer.stringifyGrid(context.grid));
};

export {};
