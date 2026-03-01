import React, {
  memo,
  Ref,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import GridOverlay from './GridOverlay';
import { useMaxCanvasSize } from './canvasHelper';

export interface RawCanvasRef {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface RenderInfo {
  tileSize: number;
  scale: number;
  bleededScale: number;
}

export interface GridCanvasOverlayProps {
  width: number;
  height: number;
  bleed?: number;
  children?: React.ReactNode;
  onResize?: (tileSize: number) => void;
  ref?: Ref<RawCanvasRef>;
}

export default memo(function GridCanvasOverlay({
  width,
  height,
  bleed,
  children,
  onResize,
  ref,
}: GridCanvasOverlayProps) {
  bleed ??= 0;
  const maxSize = useMaxCanvasSize();
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderInfo, setRenderInfo] = useState<RenderInfo>({
    tileSize: 0,
    scale: 1,
    bleededScale: 1,
  });
  useImperativeHandle(ref, () => {
    if (!canvasRef.current) {
      throw new Error('Canvas ref not set');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    ctx.resetTransform();
    ctx.translate(
      bleed * renderInfo.bleededScale,
      bleed * renderInfo.bleededScale
    );
    return { canvas: canvasRef.current, ctx };
  }, [bleed, renderInfo]);

  const resizeHandler = useEffectEvent((element: HTMLDivElement) => {
    const divWidth = element.offsetWidth;
    const newSize = width === 0 ? 0 : divWidth / width;
    if (newSize <= 0) return;
    let scale = 1;
    let bleededScale = 1;
    if (width * newSize > maxSize || height * newSize > maxSize) {
      scale = Math.min(
        maxSize / (width * newSize),
        maxSize / (height * newSize)
      );
      bleededScale = Math.min(
        (maxSize + bleed * 2) / (width * newSize + bleed * 2),
        (maxSize + bleed * 2) / (height * newSize + bleed * 2)
      );
    }
    setRenderInfo({ tileSize: newSize, scale, bleededScale });
  });

  useEffect(() => {
    if (overlayRef.current) {
      const { current } = overlayRef;
      resizeHandler(current);
      const observer = new ResizeObserver(() => resizeHandler(current));
      observer.observe(current);
      return () => observer.disconnect();
    }
  }, [onResize]);

  useEffect(() => {
    onResize?.(renderInfo.tileSize * renderInfo.bleededScale);
  }, [onResize, renderInfo]);

  return (
    <GridOverlay ref={overlayRef}>
      <canvas
        ref={canvasRef}
        width={width * renderInfo.tileSize * renderInfo.scale + bleed * 2}
        height={height * renderInfo.tileSize * renderInfo.scale + bleed * 2}
        style={{
          top: -bleed,
          left: -bleed,
          transformOrigin: 'top left',
          transform: `scale(${1 / renderInfo.bleededScale})`,
        }}
        className="absolute"
      ></canvas>
      {children}
    </GridOverlay>
  );
});
