import { memo } from 'react';
import { ConfigType, NullableBooleanConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import { FaTrashCan } from 'react-icons/fa6';
import ConfigItem from './ConfigItem';
import { tip } from '../../components/Tooltip.tsx';

export interface NullableBooleanConfigProps {
  configurable: Configurable;
  config: NullableBooleanConfig;
  setConfig?: (field: string, value: NullableBooleanConfig['default']) => void;
}

// million-ignore
export default memo(function BooleanConfig({
  configurable,
  config,
  setConfig,
}: NullableBooleanConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as boolean | null;
  return (
    <ConfigItem config={config}>
      {value === null ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setConfig?.(config.field, config.default ?? false);
          }}
        >
          Unset
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <div {...tip('Clear value')}>
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
            type="checkbox"
            className="toggle"
            checked={value}
            min="0"
            step="1"
            onChange={e => {
              setConfig?.(config.field, e.target.checked);
            }}
          />
        </div>
      )}
    </ConfigItem>
  );
});

export const type = ConfigType.NullableBoolean;
