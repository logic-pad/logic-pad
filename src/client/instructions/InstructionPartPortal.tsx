import { ReactNode, useEffect } from 'react';
import { PartPlacement } from './parts/types';
import {
  addInstructionPartAtom,
  removeInstructionPartAtom,
} from '../state/instructionParts.ts';
import { useSetAtom } from 'jotai';

export interface InstructionPartPortalProps {
  children: ReactNode;
  placement: PartPlacement;
}

export default function InstructionPartPortal({
  placement,
  children,
}: InstructionPartPortalProps) {
  const addPart = useSetAtom(addInstructionPartAtom);
  const removePart = useSetAtom(removeInstructionPartAtom);

  useEffect(() => {
    const part = children;
    addPart(placement, part);
    return () => {
      removePart(placement, part);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, children]);

  return null;
}
