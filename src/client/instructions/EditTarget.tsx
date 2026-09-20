import { RefObject, memo, useRef } from 'react';
import {
  getConfigurableLocation,
  configLocationAtom,
  configRefAtom,
} from '../state/config.ts';
import Configurable from '@logic-pad/core/data/configurable';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import { getGridAtom } from '../state/grid.ts';
import { useAtomValue, useSetAtom } from 'jotai';

export interface EditTargetProps {
  configurable: Configurable;
}

export default memo(function EditTarget({ configurable }: EditTargetProps) {
  const setLocation = useSetAtom(configLocationAtom);
  const setRef = useSetAtom(configRefAtom);
  const grid = useAtomValue(getGridAtom);
  const divRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={divRef}
      className="absolute inset-0 cursor-pointer"
      onPointerDown={() => {
        if (!divRef.current) return;
        setLocation(getConfigurableLocation(grid, configurable as Symbol));
        setRef(divRef as RefObject<HTMLDivElement>);
      }}
    ></div>
  );
});
