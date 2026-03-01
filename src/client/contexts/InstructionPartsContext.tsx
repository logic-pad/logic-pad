import React, { ReactNode, createContext, memo, use, useState } from 'react';
import { PartPlacement } from '../instructions/parts/types';

interface InstructionPartsContext {
  parts: ReadonlyMap<PartPlacement, ReactNode[]>;
  addPart: (placement: PartPlacement, part: ReactNode) => void;
  removePart: (placement: PartPlacement, part: ReactNode) => void;
}

const Context = createContext<InstructionPartsContext>({
  parts: new Map(),
  addPart: () => {},
  removePart: () => {},
});

export const useInstructionParts = () => {
  return use(Context);
};

export const InstructionPartsConsumer = Context.Consumer;

export default memo(function InstructionPartsContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [parts, setParts] = useState<ReadonlyMap<PartPlacement, ReactNode[]>>(
    new Map()
  );

  const addPart = (placement: PartPlacement, part: ReactNode) => {
    setParts(oldParts => {
      const newParts = new Map(oldParts);
      const existing = newParts.get(placement) ?? [];
      newParts.set(placement, [...existing, part]);
      return newParts;
    });
  };

  const removePart = (placement: PartPlacement, part: ReactNode) => {
    setParts(oldParts => {
      const newParts = new Map(oldParts);
      const existing = newParts.get(placement);
      if (!existing) return oldParts;
      newParts.set(
        placement,
        existing.filter(existingPart => existingPart !== part)
      );
      return newParts;
    });
  };

  return (
    <Context
      value={{
        parts,
        addPart,
        removePart,
      }}
    >
      {children}
    </Context>
  );
});
