import { memo } from 'react';
import {
  OrientationToggleConfig,
  ConfigType,
} from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import {
  Orientation,
  OrientationToggle,
} from '@logic-pad/core/data/primitives';
import { cn } from '../../../client/uiHelper.ts';
import { FaArrowUp } from 'react-icons/fa';
import { orientationToRotation } from '@logic-pad/core/data/dataHelper';
import ConfigItem from './ConfigItem.tsx';
import { useHotkeys } from 'react-hotkeys-hook';

export interface OrientationToggleConfigProps {
  configurable: Configurable;
  config: OrientationToggleConfig;
  setConfig?: (
    field: string,
    value: OrientationToggleConfig['default']
  ) => void;
}

// million-ignore
const OrientationToggleRadio = memo(function OrientationToggleRadio({
  checked,
  setChecked,
  orientation,
  className,
}: {
  checked: boolean;
  setChecked: (value: boolean) => void;
  orientation: Orientation;
  className?: string;
}) {
  return (
    <div className={cn('relative w-8 h-8', className)}>
      <input
        type="checkbox"
        name="radio-orientation-toggle"
        className="absolute inset-0 appearance-none rounded-sm checked:shadow-glow-md checked:shadow-accent checked:border-2 checked:border-accent"
        checked={checked}
        onChange={e => {
          setChecked(e.target.checked);
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
export default memo(function OrientationToggleConfig({
  configurable,
  config,
  setConfig,
}: OrientationToggleConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as OrientationToggle;

  useHotkeys(
    'up',
    () => setConfig?.(config.field, { ...value, up: !value.up }),
    [value, setConfig, config]
  );
  useHotkeys(
    'down',
    () => setConfig?.(config.field, { ...value, down: !value.down }),
    [value, setConfig, config]
  );
  useHotkeys(
    'left',
    () => setConfig?.(config.field, { ...value, left: !value.left }),
    [value, setConfig, config]
  );
  useHotkeys(
    'right',
    () => setConfig?.(config.field, { ...value, right: !value.right }),
    [value, setConfig, config]
  );
  useHotkeys(
    'right+up',
    () =>
      setConfig?.(config.field, {
        ...value,
        [Orientation.UpRight]: !value[Orientation.UpRight],
      }),
    [value, setConfig, config]
  );
  useHotkeys(
    'left+up',
    () =>
      setConfig?.(config.field, {
        ...value,
        [Orientation.UpLeft]: !value[Orientation.UpLeft],
      }),
    [value, setConfig, config]
  );
  useHotkeys(
    'right+down',
    () =>
      setConfig?.(config.field, {
        ...value,
        [Orientation.DownRight]: !value[Orientation.DownRight],
      }),
    [value, setConfig, config]
  );
  useHotkeys(
    'left+down',
    () =>
      setConfig?.(config.field, {
        ...value,
        [Orientation.DownLeft]: !value[Orientation.DownLeft],
      }),
    [value, setConfig, config]
  );

  return (
    <ConfigItem config={config}>
      <div
        className="grid grid-cols-3 grid-rows-3 tooltip tooltip-info tooltip-top"
        data-tip="Keyboard arrow keys supported"
      >
        <OrientationToggleRadio
          checked={value.up}
          setChecked={val => setConfig?.(config.field, { ...value, up: val })}
          orientation={Orientation.Up}
          className="col-start-2 row-start-1"
        />
        <OrientationToggleRadio
          checked={value.left}
          setChecked={val => setConfig?.(config.field, { ...value, left: val })}
          orientation={Orientation.Left}
          className="col-start-1 row-start-2"
        />
        <OrientationToggleRadio
          checked={value.right}
          setChecked={val =>
            setConfig?.(config.field, { ...value, right: val })
          }
          orientation={Orientation.Right}
          className="col-start-3 row-start-2"
        />
        <OrientationToggleRadio
          checked={value.down}
          setChecked={val => setConfig?.(config.field, { ...value, down: val })}
          orientation={Orientation.Down}
          className="col-start-2 row-start-3"
        />
        <OrientationToggleRadio
          checked={value[Orientation.UpLeft]}
          setChecked={val =>
            setConfig?.(config.field, { ...value, [Orientation.UpLeft]: val })
          }
          orientation={Orientation.UpLeft}
          className="col-start-1 row-start-1"
        />
        <OrientationToggleRadio
          checked={value[Orientation.UpRight]}
          setChecked={val =>
            setConfig?.(config.field, { ...value, [Orientation.UpRight]: val })
          }
          orientation={Orientation.UpRight}
          className="col-start-3 row-start-1"
        />
        <OrientationToggleRadio
          checked={value[Orientation.DownLeft]}
          setChecked={val =>
            setConfig?.(config.field, { ...value, [Orientation.DownLeft]: val })
          }
          orientation={Orientation.DownLeft}
          className="col-start-1 row-start-3"
        />
        <OrientationToggleRadio
          checked={value[Orientation.DownRight]}
          setChecked={val =>
            setConfig?.(config.field, {
              ...value,
              [Orientation.DownRight]: val,
            })
          }
          orientation={Orientation.DownRight}
          className="col-start-3 row-start-3"
        />
      </div>
    </ConfigItem>
  );
});

export const type = ConfigType.OrientationToggle;
