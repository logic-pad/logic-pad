import { memo } from 'react';
import SymbolTool from '../SymbolTool';
import FocusSymbolData, {
  instance,
} from '@logic-pad/core/data/symbols/focusSymbol';
import FocusSymbol from '../../symbols/FocusSymbol';

const sample = instance;

export default memo(function FocusTool() {
  return (
    <SymbolTool
      name="Focus/Dead End"
      order={202}
      hotkey="extraSymbols-1"
      defaultHidden={true}
      sample={sample}
      component={FocusSymbol}
      onNewSymbol={(symbol, grid) => {
        const existing = grid.findSymbol(
          sym =>
            sym.x === symbol.x && sym.y === symbol.y && sym.id !== symbol.id
        );
        if (existing) {
          return (symbol as FocusSymbolData).withDeadEnd(true);
        }
        return symbol;
      }}
    />
  );
});
