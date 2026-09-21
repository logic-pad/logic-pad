import Instruction from '@logic-pad/core/data/instruction';

export enum PartPlacement {
  SideBar = 'side-bar',
  MainGridOverlay = 'main-grid-overlay',
  GridOverlay = 'grid-overlay',
  Toolbox = 'toolbox',
}

export interface PartSpec {
  placement: PartPlacement;
  instructionId: string;
}

export interface InstructionPartProps<T extends Instruction> {
  instruction: T;
}
