import { memo, useId } from 'react';
import { ColorConfig, ConfigType } from '@logic-pad/core/data/config';
import { Color } from '@logic-pad/core/data/primitives';
import { cn } from '../../../client/uiHelper.ts';
import Configurable from '@logic-pad/core/data/configurable';
import ConfigItem from './ConfigItem.tsx';
import { FaCheck } from 'react-icons/fa';

export interface ColorConfigProps {
  configurable: Configurable;
  config: ColorConfig;
  setConfig?: (field: string, value: ColorConfig['default']) => void;
}

// million-ignore
const ColorRadio = memo(function ColorRadio({
  value,
  setValue,
  color,
  group,
}: {
  value: Color;
  setValue: (value: Color) => void;
  color: Color;
  group: string;
}) {
  return (
    <div className="relative w-8 h-8">
      <input
        type="radio"
        name={group}
        className={cn(
          'appearance-none w-8 h-8 rounded-sm checked:shadow-glow-md checked:shadow-accent border-2 border-accent',
          {
            'bg-gray-500': color === Color.Gray,
            'bg-white': color === Color.Light,
            'bg-black': color === Color.Dark,
          }
        )}
        value={color}
        checked={value === color}
        onChange={e => {
          setValue(e.target.value as Color);
        }}
      />

      {value === color && (
        <FaCheck className="absolute inset-0 m-auto text-accent" />
      )}
    </div>
  );
});

// million-ignore
export default memo(function ColorConfig({
  configurable,
  config,
  setConfig,
}: ColorConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as Color;
  const groupId = `color-radio-${useId()}`;
  return (
    <ConfigItem config={config}>
      <div className="flex gap-4">
        <ColorRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          color={Color.Dark}
          group={groupId}
        />
        {config.allowGray && (
          <ColorRadio
            value={value}
            setValue={value => setConfig?.(config.field, value)}
            color={Color.Gray}
            group={groupId}
          />
        )}
        <ColorRadio
          value={value}
          setValue={value => setConfig?.(config.field, value)}
          color={Color.Light}
          group={groupId}
        />
      </div>
    </ConfigItem>
  );
});

export const type = ConfigType.Color;
