import { memo } from 'react';
import { ConfigType, NullableNumberConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import { FaTrashCan } from 'react-icons/fa6';
import ConfigItem from './ConfigItem';

export interface NullableNumberConfigProps {
  configurable: Configurable;
  config: NullableNumberConfig;
  setConfig?: (field: string, value: NullableNumberConfig['default']) => void;
}

// million-ignore
export default memo(function NullableNumberConfig({
  configurable,
  config,
  setConfig,
}: NullableNumberConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as number | null;
  return (
    <ConfigItem config={config}>
      {value === null ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setConfig?.(
              config.field,
              config.default ?? config.min ?? config.max ?? 0
            );
          }}
        >
          Unset
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <div
            className="tooltip tooltip-info tooltip-top"
            data-tip="Clear value"
          >
            <button
              type="button"
              aria-label="Clear value"
              className="btn btn-sm"
              onClick={() => {
                setConfig?.(config.field, null);
              }}
            >
              <FaTrashCan />
            </button>
          </div>
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
        </div>
      )}
    </ConfigItem>
  );
});

export const type = ConfigType.NullableNumber;
