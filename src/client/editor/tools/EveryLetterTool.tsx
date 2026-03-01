import { memo } from 'react';
import SymbolTool from '../SymbolTool';
import { instance } from '@logic-pad/core/data/symbols/everyLetterSymbol';
import EveryLetterSymbol from '../../symbols/EveryLetterSymbol';

const sample = instance;

export default memo(function EveryLetterTool() {
  return (
    <SymbolTool
      name="Hollow Letter"
      order={304}
      hotkey="extraSymbols-6"
      defaultHidden={true}
      sample={sample}
      component={EveryLetterSymbol}
    />
  );
});
