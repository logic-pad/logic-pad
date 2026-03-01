import { memo } from 'react';
import { OrientationConfig, ConfigType } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import { Orientation } from '@logic-pad/core/data/primitives';
import { cn } from '../../../client/uiHelper.ts';
import { FaArrowUp } from 'react-icons/fa';
import { orientationToRotation } from '@logic-pad/core/data/dataHelper';
import ConfigItem from './ConfigItem.tsx';
import { useHotkeys } from 'react-hotkeys-hook';

export interface OrientationConfigProps {
  configurable: Configurable;
  config: OrientationConfig;
  setConfig?: (field: string, value: OrientationConfig['default']) => void;
}

// million-ignore
const OrientationRadio = memo(function OrientationRadio({
  value,
  setValue,
  orientation,
  className,
}: {
  value: Orientation;
  setValue: (value: Orientation) => void;
  orientation: Orientation;
  className?: string;
}) {
  return (
    <div className={cn('relative w-8 h-8', className)}>
      <input
        type="radio"
        name="radio-orientation"
        className="absolute inset-0 appearance-none rounded-sm checked:shadow-glow-md checked:shadow-accent checked:border-2 checked:border-accent"
        value={orientation}
        checked={value === orientation}
        onChange={e => {
          setValue(e.target.value as Orientation);
        }}
      />
      <FaArrowUp
        className="absolute inset-0 m-auto pointer-events-none"
        style={{
          transform: `rotate(${orientationToRotation(orientation)}deg)`,
        }}
      />
    </div>
  );
});

// million-ignore
export default memo(function OrientationConfig({
  configurable,
  config,
  setConfig,
}: OrientationConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as Orientation;

  useHotkeys('up', () => setConfig?.(config.field, Orientation.Up), [
    setConfig,
    config.field,
  ]);
  useHotkeys('down', () => setConfig?.(config.field, Orientation.Down), [
    setConfig,
    config.field,
  ]);
  useHotkeys('left', () => setConfig?.(config.field, Orientation.Left), [
    setConfig,
    config.field,
  ]);
  useHotkeys('right', () => setConfig?.(config.field, Orientation.Right), [
    setConfig,
    config.field,
  ]);
  useHotkeys('right+up', () => setConfig?.(config.field, Orientation.UpRight), [
    setConfig,
    config.field,
  ]);
  useHotkeys('left+up', () => setConfig?.(config.field, Orientation.UpLeft), [
    setConfig,
    config.field,
  ]);
  useHotkeys(
    'right+down',
    () => setConfig?.(config.field, Orientation.DownRight),
    [setConfig, config.field]
  );
  useHotkeys(
    'left+down',
    () => setConfig?.(config.field, Orientation.DownLeft),
    [setConfig, config.field]
  );

  return (
    <ConfigItem config={config}>
      <div
        className="grid grid-cols-3 grid-rows-3 tooltip tooltip-info tooltip-top"
        data-tip="Keyboard arrow keys supported"
      >
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.Up}
          className="col-start-2 row-start-1"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.Left}
          className="col-start-1 row-start-2"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.Right}
          className="col-start-3 row-start-2"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.Down}
          className="col-start-2 row-start-3"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.DownLeft}
          className="col-start-1 row-start-3"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.DownRight}
          className="col-start-3 row-start-3"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.UpLeft}
          className="col-start-1 row-start-1"
        />
        <OrientationRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          orientation={Orientation.UpRight}
          className="col-start-3 row-start-1"
        />
      </div>
    </ConfigItem>
  );
});

export const type = ConfigType.Orientation;
