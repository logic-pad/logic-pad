import { memo } from 'react';
import { ConfigType, NumberConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import ConfigItem from './ConfigItem';

export interface NumberConfigProps {
  configurable: Configurable;
  config: NumberConfig;
  setConfig?: (field: string, value: NumberConfig['default']) => void;
}

// million-ignore
export default memo(function NumberConfig({
  configurable,
  config,
  setConfig,
}: NumberConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as number;
  return (
    <ConfigItem config={config}>
      <input
        type="number"
        className="input min-w-0 grow"
        value={value}
        min={config.min}
        max={config.max}
        step={config.step ?? 1}
        onFocus={e => e.target.select()}
        onChange={e => {
          if (config.step === 1)
            setConfig?.(config.field, Math.floor(Number(e.target.value)));
          else setConfig?.(config.field, Number(e.target.value));
        }}
      />
    </ConfigItem>
  );
});

export const type = ConfigType.Number;
