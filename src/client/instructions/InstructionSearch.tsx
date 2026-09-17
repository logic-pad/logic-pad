import { memo, useState } from 'react';
import { allRules } from '@logic-pad/core/data/rules/index';
import Rule from '@logic-pad/core/data/rules/rule';
import Autocomplete from '../components/Autocomplete';
import { cn } from '../uiHelper.ts';
import { gridAtom, setGridAtom } from '../state/grid.ts';
import { useAtomValue, useSetAtom } from 'jotai';

const ruleList = [...allRules.values()].flatMap(rule => rule.searchVariants);
const descriptionList = ruleList.map(x => x.description);

export interface InstructionSearchProps {
  className?: string;
}

// million-ignore
export default memo(function InstructionSearch({
  className,
}: InstructionSearchProps) {
  const grid = useAtomValue(gridAtom);
  const setGrid = useSetAtom(setGridAtom);
  const [search, setSearch] = useState('');

  const addRule = (rule: Rule) => {
    setSearch('');
    setGrid(grid.addRule(rule.copyWith({})));
  };

  return (
    <Autocomplete
      className={cn('shrink-0 mt-4 w-full max-w-[320px]', className)}
      placeholder="Add a new rule..."
      items={descriptionList}
      value={search}
      all={true}
      onChange={setSearch}
      onConfirm={val =>
        addRule(ruleList.find(x => x.description === val)!.rule)
      }
    />
  );
});
