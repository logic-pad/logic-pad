import { memo } from 'react';
import {
  ConfigType,
  NullableInstrumentConfig,
} from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import { INSTRUMENTS, Instrument } from '@logic-pad/core/data/primitives';
import ConfigItem from './ConfigItem';
import { FaTrashCan } from 'react-icons/fa6';

export interface NullableInstrumentConfigProps {
  configurable: Configurable;
  config: NullableInstrumentConfig;
  setConfig?: (
    field: string,
    value: NullableInstrumentConfig['default']
  ) => void;
}

// million-ignore
export default memo(function NullableInstrumentConfig({
  configurable,
  config,
  setConfig,
}: NullableInstrumentConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as Instrument | null;
  return (
    <ConfigItem config={config}>
      {value === null ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setConfig?.(config.field, config.default ?? Instrument.Piano);
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
          <select
            className="select select-bordered w-36"
            value={value}
            onChange={e =>
              setConfig?.(
                config.field,
                e.currentTarget.value as Instrument | null
              )
            }
          >
            {INSTRUMENTS.map(c => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
    </ConfigItem>
  );
});

export const type = ConfigType.NullableInstrument;
