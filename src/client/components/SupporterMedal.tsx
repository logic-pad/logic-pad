import { memo, useRef, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import './supporterMedal.css';
import { cn } from '../uiHelper';

export interface SupporterMedalProps {
  supporter: number;
  onClick?: () => void;
}

export default memo(function SupporterMedal({
  supporter,
  onClick,
}: SupporterMedalProps) {
  const cardFrameRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cardFrame = cardFrameRef.current;
    const glow = glowRef.current;
    if (!cardFrame || !glow || supporter < 3) return;
    const mouseMove = (event: MouseEvent) => {
      const rect = cardFrame.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      glow.style.left = `${x}%`;
      glow.style.top = `${y}%`;
    };
    const mouseLeave = () => {
      glow.style.left = `0%`;
      glow.style.top = `0%`;
    };
    cardFrame.addEventListener('mousemove', mouseMove);
    cardFrame.addEventListener('mouseleave', mouseLeave);
    return () => {
      cardFrame.removeEventListener('mousemove', mouseMove);
      cardFrame.removeEventListener('mouseleave', mouseLeave);
    };
  }, [supporter]);
  return (
    <div
      ref={cardFrameRef}
      className={cn(
        'w-fit h-fit transition-transform cursor-pointer',
        supporter === 0 && 'grayscale',
        supporter >= 3 && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative aspect-square w-48 rounded-full bg-gray-700 overflow-hidden shadow-lg transition-shadow',
          supporter >= 3 && 'hover:shadow-xl'
        )}
      >
        <div ref={glowRef} className="glow absolute w-px h-px"></div>
        <div className="absolute bg-neutral inset-[2px] flex-1 rounded-full opacity-90 overflow-hidden"></div>
        <div className="absolute inset-[2px] flex-1 rounded-full opacity-90 overflow-hidden bg-accent/10"></div>
        <div className="absolute inset-8">
          {supporter >= 2 && (
            <FaHeart className="absolute w-full h-full text-accent animate-ping-sm opacity-20" />
          )}
          <FaHeart className="absolute w-full h-full text-accent" />
        </div>
      </div>
    </div>
  );
});
