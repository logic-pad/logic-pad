import { memo, useRef } from 'react';
import { ConfigType, SolvePathConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import { FiExternalLink } from 'react-icons/fi';
import { Position } from '@logic-pad/core/data/primitives';
import SolvePathEditorModal, {
  SolvePathEditorRef,
} from './SolvePathEditorModal';
import { useAtomValue } from 'jotai';
import { gridAtom, metadataAtom } from '../../state/grid.ts';
import ConfigItem from './ConfigItem';

export interface SolvePathConfigProps {
  configurable: Configurable;
  config: SolvePathConfig;
  setConfig?: (field: string, value: SolvePathConfig['default']) => void;
}

export default memo(function SolvePathConfig({
  configurable,
  config,
  setConfig,
}: SolvePathConfigProps) {
  const grid = useAtomValue(gridAtom);
  const metadata = useAtomValue(metadataAtom);
  const solvePath = configurable[
    config.field as keyof typeof configurable
  ] as unknown as Position[];

  const editorRef = useRef<SolvePathEditorRef>(null);

  return (
    <ConfigItem config={config}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="btn justify-start flex-nowrap flex"
          onClick={() => editorRef.current?.open(solvePath, grid, metadata)}
        >
          Open editor
          <FiExternalLink size={24} />
        </button>

        <SolvePathEditorModal
          ref={editorRef}
          onChange={solvePath => setConfig?.(config.field, solvePath)}
        />
      </div>
    </ConfigItem>
  );
});

export const type = ConfigType.SolvePath;
