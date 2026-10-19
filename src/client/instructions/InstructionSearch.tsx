import { memo, useMemo, useState } from 'react';
import { allRules } from '@logic-pad/core/data/rules/index';
import Rule from '@logic-pad/core/data/rules/rule';
import Autocomplete from '../components/Autocomplete';
import { cn } from '../uiHelper.ts';
import { setGridAtom } from '../state/grid.ts';
import { useSetAtom } from 'jotai';
import { useActiveLocale } from '../router/useLocale.ts';

const ruleList = [...allRules.values()].flatMap(rule => rule.searchVariants);

export interface InstructionSearchProps {
  className?: string;
}

// million-ignore
export default memo(function InstructionSearch({
  className,
}: InstructionSearchProps) {
  const setGrid = useSetAtom(setGridAtom);
  const locale = useActiveLocale();
  const [search, setSearch] = useState('');

  const descriptions = useMemo(
    () => ruleList.map(rule => rule.description),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  const addRule = (rule: Rule) => {
    setSearch('');
    setGrid(grid => grid.addRule(rule.copyWith({})));
  };

  return (
    <Autocomplete
      className={cn('shrink-0 mt-4 w-full max-w-[320px]', className)}
      placeholder="Add a new rule..."
      items={descriptions}
      value={search}
      all={true}
      onChange={setSearch}
      onConfirm={(_, index) => addRule(ruleList[index].rule)}
    />
  );
});
