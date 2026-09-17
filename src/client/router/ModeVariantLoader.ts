import { memo, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { gridAtom, setGridRawAtom } from '../state/grid.ts';
import { Mode } from '@logic-pad/core/data/primitives';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import Rule from '@logic-pad/core/data/rules/rule';

export interface ModeVariantLoaderProps {
  mode: Mode;
}

export default memo(function ModeVariantLoader({
  mode,
}: ModeVariantLoaderProps) {
  const grid = useAtomValue(gridAtom);
  const setGridRaw = useSetAtom(setGridRawAtom);
  useEffect(() => {
    let changed = false;
    const newRules: Rule[] = [];
    for (const rule of grid.rules) {
      const newRule = rule.modeVariant(mode);
      if (newRule !== rule) changed = true;
      if (newRule) newRules.push(newRule);
    }
    const newSymbols = new Map<string, Symbol[]>();
    for (const [key, symbols] of grid.symbols) {
      const newSymbolList: Symbol[] = [];
      for (const symbol of symbols) {
        const newSymbol = symbol.modeVariant(mode);
        if (newSymbol !== symbol) changed = true;
        if (newSymbol) newSymbolList.push(newSymbol);
      }
      newSymbols.set(key, newSymbolList);
    }
    if (changed) {
      setGridRaw(
        grid.copyWith({ rules: newRules, symbols: newSymbols }, false)
      );
    }
  }, [grid, mode, setGridRaw]);
  return null;
});
