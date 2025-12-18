import { memo, Ref, useEffect, useMemo, useRef, useState } from 'react';
import MainGrid from '../../grid/MainGrid';
import InstructionList from '../../instructions/InstructionList';
import { cn, safeClipboard } from '../../uiHelper';
import Metadata from '../../metadata/Metadata';
import Loading from '../Loading';
import html2canvas from 'html2canvas-pro';
import GridStateContext, {
  defaultState,
  useGridState,
} from '../../contexts/GridStateContext';
import GridContext, { useGrid } from '../../contexts/GridContext';
import DisplayContext, { useDisplay } from '../../contexts/DisplayContext';
import { FaAngleDown, FaCamera } from 'react-icons/fa';

interface CopyImageButtonProps {
  canvas?: HTMLCanvasElement | null;
}

const CopyImageButton = memo(function CopyImageButton({
  canvas,
}: CopyImageButtonProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  useEffect(() => {
    if (tooltip && tooltip.length > 0) {
      const timeout = window.setTimeout(() => setTooltip(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [tooltip]);
  return (
    <div
      className={cn(
        'tooltip tooltip-info tooltip-top flex-1',
        tooltip && 'tooltip-open'
      )}
      data-tip={tooltip}
    >
      <button
        className="btn btn-primary w-full"
        disabled={!canvas}
        onClick={() => {
          if (!canvas) return;
          canvas.toBlob(async blob => {
            if (!blob) return;
            const item = new ClipboardItem({ 'image/png': blob });
            await safeClipboard.write([item]);
            setTooltip('Copied!');
          });
        }}
      >
        Copy to clipboard
      </button>
    </div>
  );
});

interface PuzzleImageProps {
  resetGrid: boolean;
  resetScale: boolean;
  gridOnly: boolean;
  ref?: Ref<HTMLDivElement>;
}

const PuzzleImage = memo(function PuzzleImage({
  resetGrid,
  resetScale,
  gridOnly,
  ref,
}: PuzzleImageProps) {
  const { grid, metadata } = useGrid();
  const { state } = useGridState();
  const { scale } = useDisplay();

  const newGrid = useMemo(
    () => (resetGrid ? grid.resetTiles() : grid),
    [grid, resetGrid]
  );

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 shrink-0 w-fit h-fit bg-neutral border-0 m-0 pointer-events-none opacity-0 p-[8px]"
    >
      <div
        className={cn(
          'w-fit h-fit flex gap-4 items-center',
          gridOnly ? 'p-4' : 'py-4 pl-4 pr-0'
        )}
      >
        <DisplayContext scale={resetScale ? 1 : scale} responsiveScale={false}>
          <GridStateContext state={resetGrid ? defaultState : state}>
            <GridContext grid={newGrid} initialMetadata={metadata}>
              <div className="flex flex-col gap-4">
                {gridOnly || <Metadata simplified={true} responsive={false} />}
                <MainGrid
                  useToolboxClick={false}
                  allowAnimation={false}
                  allowSounds={false}
                />
              </div>
              {gridOnly || (
                <div className="pr-2">
                  <InstructionList responsive={false} />
                </div>
              )}
            </GridContext>
          </GridStateContext>
        </DisplayContext>
      </div>
    </div>
  );
});

const ImageGenerator = memo(function ImageGenerator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [resetGrid, setResetGrid] = useState(true);
  const [resetScale, setResetScale] = useState(true);
  const [gridOnly, setGridOnly] = useState(false);
  const image = useMemo(() => {
    if (canvas) {
      return (
        <img
          src={canvas.toDataURL()}
          onContextMenu={e => e.stopPropagation()}
        />
      );
    } else {
      return <Loading />;
    }
  }, [canvas]);
  const handle = useRef<number | null>(null);
  useEffect(() => {
    setCanvas(null);
    const currentHandle = window.setTimeout(() => {
      if (!containerRef.current) return;
      // Workaround for https://github.com/yorickshan/html2canvas-pro/issues/108
      document.querySelectorAll('slot').forEach(slot => {
        slot.assignedNodes = () => [...slot.childNodes];
      });

      html2canvas(containerRef.current, {
        foreignObjectRendering: true,
        x: 0,
        y: 0,
        windowHeight: 1080,
        windowWidth: 1920,
        scale: 1,
        onclone(document, element) {
          element.parentElement?.removeChild(element);
          document.body.appendChild(element);
          element.style.opacity = '1';
          document.body.style.backgroundColor = element.style.backgroundColor;
        },
      })
        .then(result => {
          console.log(
            'Rendered image with size',
            result.width,
            result.height,
            'device pixel ratio',
            window.devicePixelRatio
          );
          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = result.width - 16;
          croppedCanvas.height = result.height - 16;
          const ctx = croppedCanvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(
            result,
            8,
            8,
            croppedCanvas.width,
            croppedCanvas.height,
            0,
            0,
            croppedCanvas.width,
            croppedCanvas.height
          );
          if (handle.current !== currentHandle) return;
          setCanvas(croppedCanvas);
        })
        .catch(console.error);
    }, 1000);
    handle.current = currentHandle;
    return () => clearTimeout(currentHandle);
  }, [resetScale, resetGrid, gridOnly]);
  return (
    <div
      tabIndex={0}
      className="dropdown-content flex flex-col bg-base-100 rounded-box z-1 w-[320px] p-4 shadow-sm mt-4 mb-4"
    >
      <div className="overflow-hidden h-0 w-0 scale-50">
        <PuzzleImage
          resetGrid={resetGrid}
          resetScale={resetScale}
          gridOnly={gridOnly}
          ref={containerRef}
        />
      </div>
      <div className="flex flex-col gap-4">
        {image}
        <fieldset className="fieldset">
          <label className="label w-full justify-between cursor-pointer">
            <span className="label-text">Reset grid</span>
            <input
              type="checkbox"
              className="toggle"
              checked={resetGrid}
              onChange={e => setResetGrid(e.target.checked)}
            />
          </label>
        </fieldset>
        <fieldset className="fieldset">
          <label className="label w-full justify-between cursor-pointer">
            <span className="label-text">Reset scale</span>
            <input
              type="checkbox"
              className="toggle"
              checked={resetScale}
              onChange={e => setResetScale(e.target.checked)}
            />
          </label>
        </fieldset>
        <fieldset className="fieldset">
          <label className="label w-full justify-between cursor-pointer">
            <span className="label-text">Grid only</span>
            <input
              type="checkbox"
              className="toggle"
              checked={gridOnly}
              onChange={e => setGridOnly(e.target.checked)}
            />
          </label>
        </fieldset>
        <CopyImageButton canvas={canvas} />
      </div>
    </div>
  );
});

export default memo(function SharePuzzleImage() {
  const [open, setOpen] = useState(false);
  return (
    <details className="dropdown dropdown-open dropdown-bottom xl:dropdown-top self-center">
      <summary
        className="tooltip tooltip-info tooltip-right btn btn-md btn-ghost flex items-center w-fit focus:z-50"
        role="button"
        data-tip={open ? 'Close panel' : 'Share puzzle image'}
        onClick={() => setOpen(v => !v)}
      >
        {open ? <FaAngleDown size={24} /> : <FaCamera size={24} />}
      </summary>
      {open && <ImageGenerator />}
    </details>
  );
});
