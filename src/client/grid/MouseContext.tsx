import { Color } from '@logic-pad/core/data/primitives';
import { getSetting } from '../state/settings.ts';

class MouseContext {
  color: Color | null;
  replacing: boolean;
  inverted: boolean;
  modifierInverted: boolean;

  constructor() {
    this.color = null;
    this.replacing = false;
    this.inverted = getSetting('flipPrimaryMouseButton');
    this.modifierInverted = false;
  }

  setColor(color: Color | null, replacing: boolean) {
    this.color = color;
    this.replacing = replacing;
  }

  setInverted(inverted: boolean) {
    this.inverted = inverted;
  }

  setModifierInverted(modifierInverted: boolean) {
    this.modifierInverted = modifierInverted;
  }

  getColorForButtons(buttons: number) {
    if (this.inverted) {
      buttons = 3 - buttons;
    }
    switch (buttons) {
      case 1:
        return Color.Dark;
      case 2:
        return Color.Light;
      default:
        return undefined;
    }
  }

  getModifier(ctrlKey: boolean) {
    if (this.modifierInverted) {
      ctrlKey = !ctrlKey;
    }
    return ctrlKey;
  }
}

const mouseContext = new MouseContext();

export default mouseContext;
