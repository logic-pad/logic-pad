import { memo, useMemo } from 'react';
import fuzzysort from 'fuzzysort-esm';
import { cn } from '../../client/uiHelper.ts';
import AnnotatedText from './AnnotatedText';

interface Target {
  label: string;
  index: number;
}

export interface AutocompleteProps {
  items: string[];
  value: string;
  all?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  /**
   * Called with the chosen label and its index into `items`.
   *
   * Prefer `index` when `items` may contain possible duplicates.
   */
  onConfirm?: (value: string, index: number) => void;
  className?: string;
}

// million-ignore
export default memo(function Autocomplete({
  items,
  value,
  all,
  placeholder,
  onChange,
  onConfirm,
  className,
}: AutocompleteProps) {
  all = all ?? false;

  // Carry the source index alongside each label so a selection can be resolved
  // without relying on label uniqueness.
  const targets = useMemo<Target[]>(
    () => items.map((label, index) => ({ label, index })),
    [items]
  );

  const results = useMemo(
    () => fuzzysort.go(value, targets, { key: 'label', limit: 50, all }),
    [value, targets, all]
  );

  const confirm = (target: Target) => {
    onChange?.(target.label);
    onConfirm?.(target.label, target.index);
  };

  return (
    <div className={cn('shrink-0', className)}>
      <div className="dropdown dropdown-end w-full z-10">
        <input
          type="text"
          tabIndex={0}
          placeholder={placeholder}
          className="input w-full max-w-xs text-base-content"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const target = results[0]?.obj;
              if (target) confirm(target);
            } else if (e.key === 'Escape') {
              onChange?.('');
            }
          }}
        />
        <ul
          tabIndex={0}
          className={cn(
            'dropdown-content z-1 menu flex-nowrap overflow-y-auto p-2 shadow-sm bg-base-100 text-base-content rounded-box w-full m-0 max-h-[50vh]',
            results.length === 0 && 'hidden'
          )}
        >
          {results.map(result => (
            <li key={result.obj.index}>
              <a
                className="overflow-hidden"
                onClick={() => confirm(result.obj)}
              >
                <AnnotatedText>{result.obj.label}</AnnotatedText>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
