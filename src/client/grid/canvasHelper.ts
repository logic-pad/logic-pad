import canvasSize from 'canvas-size';
import { useSyncExternalStore } from 'react';

class CanvasMaxSize {
  private size: number | null;
  private subscribers = new Set<(size: number) => void>();

  public constructor() {
    const storedSize = localStorage.getItem('maxCanvasSize');
    this.size = storedSize ? parseInt(storedSize, 10) : null;
    if (Number.isNaN(this.size)) {
      this.size = null;
    }
    if (this.size === null) {
      canvasSize
        .maxArea({
          useWorker: true,
          usePromise: true,
        })
        .then(result => {
          console.log(
            'Determined max canvas size:',
            result.width,
            'x',
            result.height,
            'in',
            result.benchmark,
            'ms'
          );
          this.set(result.width);
        })
        .catch(e => console.log('Failed to determine max canvas size', e));
    }
  }

  public get = () => {
    return Math.min(10340, this.size ?? 5100) - 100;
  };

  public set(size: number) {
    this.size = size;
    localStorage.setItem('maxCanvasSize', size.toString());
    this.notify();
  }

  public subscribe = (callback: (size: number) => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  public notify() {
    const size = this.get();
    for (const callback of this.subscribers) {
      callback(size);
    }
  }
}

export const canvasMaxSize = new CanvasMaxSize();

export const useMaxCanvasSize = () => {
  return useSyncExternalStore(canvasMaxSize.subscribe, canvasMaxSize.get);
};
