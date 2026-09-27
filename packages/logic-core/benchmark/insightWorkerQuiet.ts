/**
 * A drop-in replacement for the insight solver worker that silences all
 * console output. Used by insightEval.ts to keep the evaluation output clean.
 *
 * The real worker only writes to the console while handling solve requests,
 * so silencing the console right after the static import (and before the
 * first message is processed) is sufficient. Do NOT use a top-level await
 * here: messages posted by the parent while module evaluation is suspended
 * would be lost.
 */
import '../src/data/solver/insight/insightWorker.js';

console.log = () => {};
console.error = () => {};

export {};
