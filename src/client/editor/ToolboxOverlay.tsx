import { memo } from 'react';
import { toolOverlayAtom } from '../state/toolbox.ts';
import { useAtomValue } from 'jotai';

export default memo(function ToolboxOverlay() {
  const gridOverlay = useAtomValue(toolOverlayAtom);
  return gridOverlay;
});
