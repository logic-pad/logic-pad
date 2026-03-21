import { Serializer } from '../../serializer/allSerializers.js';
import { Color, State } from '../../primitives.js';
import validateGrid from '../../validate.js';
import InsightContext from './insightContext.js';
import InsightError from './types/insightError.js';
import allLemmas from './lemmas/allLemmas.js';
import { ProofNode } from './types/proof.js';

export interface SolveRequest {
  data: string;
  completeSolve: boolean;
  reportProof: boolean;
  reportProgress: boolean;
}

export interface SolveResponse {
  type: 'solve';
  data: string | null | undefined;
  proofs?: ProofNode[];
}

export interface ProgressResponse {
  type: 'progress';
  progress: number;
  total: number;
}

export interface ErrorResponse {
  type: 'error';
  message: string;
}

export type Response = SolveResponse | ProgressResponse | ErrorResponse;

onmessage = e => {
  const request = e.data as SolveRequest;
  const grid = Serializer.parseGrid(request.data);
  const context = new InsightContext(grid);

  const initialValidation = validateGrid(context.grid, null);
  if (initialValidation.final === State.Error) {
    postMessage({
      type: 'solve',
      data: null,
    } satisfies Response);
    return;
  }
  if (initialValidation.final === State.Satisfied) {
    postMessage({
      type: 'solve',
      data: undefined,
    } satisfies Response);
    return;
  }

  const lemmas = allLemmas.filter(lemma => lemma.isApplicable(context.grid));

  let lastHistoryLength = 0;
  const total = request.completeSolve
    ? context.grid.getTileCount(true, false, Color.Gray)
    : lemmas.length;
  try {
    let restart = true;
    mainLoop: while (restart) {
      restart = false;
      if (request.reportProgress && request.completeSolve) {
        postMessage({
          type: 'progress',
          progress: total - context.grid.getTileCount(true, false, Color.Gray),
          total,
        } satisfies Response);
      }

      for (const [index, lemma] of lemmas.entries()) {
        if (request.reportProgress && !request.completeSolve) {
          postMessage({
            type: 'progress',
            progress: index,
            total,
          } satisfies Response);
        }
        const changed = lemma.apply(context);
        if (changed) {
          console.log(`%c${lemma.id}:\n  successful`, 'color: darkgray');
          context.tileHistory
            .slice(lastHistoryLength)
            .forEach(history => console.log(history.proof.toString()));
          lastHistoryLength = context.tileHistory.length;

          restart = true;
          if (!request.completeSolve && context.tileHistory.length > 0) {
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
      postMessage({
        type: 'error',
        message: error.message,
      } satisfies Response);
      return;
    } else {
      // Unexpected error, rethrow
      throw error;
    }
  }

  if (context.tileHistory.length > 0) {
    if (request.completeSolve) {
      postMessage({
        type: 'solve',
        data: Serializer.stringifyGrid(context.grid),
        proofs: request.reportProof
          ? context.tileHistory.map(history => history.proof.root)
          : undefined,
      } satisfies Response);
    } else {
      // Some lemmas output several steps at once
      // Only report the first step to avoid overwhelming the UI
      postMessage({
        type: 'solve',
        data: Serializer.stringifyGrid(context.tileHistory[0].newGrid),
        proofs: request.reportProof
          ? [context.tileHistory[0].proof.root]
          : undefined,
      } satisfies Response);
    }
  } else {
    postMessage({
      type: 'solve',
      data: undefined,
    } satisfies Response);
  }

  postMessage({
    type: 'solve',
    data: undefined,
  } satisfies Response);
};

export {};
