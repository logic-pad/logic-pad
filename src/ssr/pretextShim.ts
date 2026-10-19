import { createCanvas, SKRSContext2D } from '@napi-rs/canvas';

/**
 * Pretext measures text through a Canvas 2D context. Outside a browser it looks
 * for a global `OffscreenCanvas`, so supply one backed by the same native
 * canvas the renderer paints with — that way its measurements are the widths
 * the glyphs actually occupy, rather than an approximation.
 *
 * Imported for its side effect, and it must be evaluated before
 * `@chenglou/pretext`, so it lives in its own module.
 */
const context: SKRSContext2D = createCanvas(1, 1).getContext('2d');

class OffscreenCanvas {
  constructor(
    public width: number,
    public height: number
  ) {}

  getContext(): SKRSContext2D {
    return context;
  }
}

const g = globalThis as { OffscreenCanvas?: unknown };
g.OffscreenCanvas ??= OffscreenCanvas;
