import React from 'react';
import { InstructionPartProps, PartPlacement, PartSpec } from './types';
import Instruction from '@logic-pad/core/data/instruction';

export type PartComponent = React.NamedExoticComponent<
  InstructionPartProps<Instruction>
>;

export interface PartInfo {
  readonly component: PartComponent;
  readonly placement: PartPlacement;
  readonly instructionId: string;
}

const modules = import.meta.glob<{
  default?: PartComponent;
  spec?: PartSpec;
}>(['./**/*.tsx', '!./types.ts'], {
  eager: true,
});

const allParts = new Map<string, PartInfo[]>();

function register(spec: PartSpec, component: PartComponent) {
  let list: PartInfo[];
  if (allParts.has(spec.instructionId)) {
    list = allParts.get(spec.instructionId)!;
  } else {
    list = [];
    allParts.set(spec.instructionId, list);
  }
  list.push({
    ...spec,
    component,
  });
}

Object.values(modules).forEach(module => {
  if (
    'default' in module &&
    'spec' in module &&
    module.default &&
    module.spec
  ) {
    const { default: component, spec } = module;
    register(spec, component);
  }
});

export { allParts };
