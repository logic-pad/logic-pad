import { memo, useMemo } from 'react';
import GridOverlay from './GridOverlay';

export interface RulerOverlayProps {
  width: number;
  height: number;
}

export default memo(function RulerOverlay({
  width,
  height,
}: RulerOverlayProps) {
  const verticalRuler = useMemo(
    () => (
      <div className="absolute top-0 bottom-0 -left-8 flex flex-col justify-around w-fit opacity-40 transition-opacity">
        {Array.from({ length: height }, (_, i) => (
          <span
            key={i}
            className="w-6 h-6 bg-base-300 text-base-content text-center"
          >{`${i}`}</span>
        ))}
      </div>
    ),
    [height]
  );
  const horizontalRuler = useMemo(
    () => (
      <div className="absolute left-0 right-0 -top-8 flex justify-around h-fit opacity-40 transition-opacity">
        {Array.from({ length: width }, (_, i) => (
          <span
            key={i}
            className="w-6 h-6 bg-base-300 text-base-content text-center"
          >{`${i}`}</span>
        ))}
      </div>
    ),
    [width]
  );
  return (
    <GridOverlay className="z-1 text-sm">
      {verticalRuler}
      {horizontalRuler}
    </GridOverlay>
  );
});
