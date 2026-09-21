import { memo, useRef } from 'react';
import { ConfigType, NullableGridConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import GridData from '@logic-pad/core/data/grid';
import { FiExternalLink } from 'react-icons/fi';
import GridEditorModal, { GridEditorRef } from './GridEditorModal';
import { FaTrashCan } from 'react-icons/fa6';
import ConfigItem from './ConfigItem';
import { tip } from '../../components/Tooltip.tsx';

export interface NullableGridConfigProps {
  configurable: Configurable;
  config: NullableGridConfig;
  setConfig?: (field: string, value: NullableGridConfig['default']) => void;
}

export default memo(function GridConfig({
  configurable,
  config,
  setConfig,
}: NullableGridConfigProps) {
  const grid = configurable[
    config.field as keyof typeof configurable
  ] as unknown as GridData | null;
  const editorRef = useRef<GridEditorRef>(null);

  return (
    <ConfigItem config={config}>
      {grid === null ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setConfig?.(config.field, config.nonNullDefault);
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
          <button
            type="button"
            className="btn justify-start flex-nowrap flex"
            onClick={() => editorRef.current?.open(grid)}
          >
            Open editor
            <FiExternalLink size={24} />
          </button>

          <GridEditorModal
            ref={editorRef}
            onChange={grid => setConfig?.(config.field, grid)}
          />
        </div>
      )}
    </ConfigItem>
  );
});

export const type = ConfigType.NullableGrid;
