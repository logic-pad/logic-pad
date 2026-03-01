import { memo, useMemo } from 'react';
import fuzzysort from 'fuzzysort-esm';
import { cn } from '../../client/uiHelper.ts';
import AnnotatedText from './AnnotatedText';

export interface AutocompleteProps {
  items: string[];
  value: string;
  all?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  onConfirm?: (value: string) => void;
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

  const results = useMemo(
    () => fuzzysort.go(value, items, { limit: 50, all }),
    [value, items, all]
  );

  const confirm = (value: string) => {
    onChange?.(value);
    onConfirm?.(value);
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
              const result = results[0]?.target;
              if (result) confirm(result);
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
            <li key={result.target}>
              <a
                className="overflow-hidden"
                onClick={() => confirm(result.target)}
              >
                <AnnotatedText>{result.target}</AnnotatedText>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
