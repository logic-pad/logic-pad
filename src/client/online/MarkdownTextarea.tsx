import React, { memo, useCallback, useImperativeHandle, useRef } from 'react';
import {
  MentionsInput,
  Mention,
  type MentionsInputHandle,
  MentionsInputClassNames,
  MentionsInputProps,
} from 'react-mentions-ts';
import { api } from './api';
import { PuzzleAutocomplete } from './data';
import { cn, offlineLinkRegex, onlineLinkRegex } from '../uiHelper';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { useOnline } from '../state/online';

export type MarkdownTextareaRef = {
  insertText: (content: string) => void;
  focus: () => void;
};

export interface MarkdownTextareaProps {
  ref?: React.Ref<MarkdownTextareaRef>;
  value: string;
  onChange: (newValue: string) => void;
  onKeyDown?: MentionsInputProps['onKeyDown'];
  className?: string;
  inputClassName?: string;
  autoResize?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const puzzleAutocomplete = async (q: string): Promise<PuzzleAutocomplete[]> => {
  const offlineLinks = q.matchAll(offlineLinkRegex);
  for (const match of offlineLinks) {
    if (match[1]) {
      try {
        const puzzle = Serializer.parsePuzzle(
          await Compressor.decompress(decodeURIComponent(match[1]))
        );
        return [
          {
            id: `/solve?d=${match[1]}`,
            title: puzzle.title.length === 0 ? 'Untitled puzzle' : puzzle.title,
          },
        ];
      } catch (_) {}
    }
  }
  const onlineLinks = q.matchAll(onlineLinkRegex);
  for (const match of onlineLinks) {
    if (match[1]) {
      try {
        const puzzleBrief = await api.getPuzzleBriefForSolve(match[1]);
        return [
          {
            id: `/solve/${puzzleBrief.id}`,
            title:
              puzzleBrief.title.length === 0
                ? 'Untitled puzzle'
                : puzzleBrief.title,
          },
        ];
      } catch (_) {}
    }
  }
  const results = await api.puzzleAutocomplete(q);
  return results.map(r => ({
    id: `/solve/${r.id}`,
    title: r.title,
  }));
};

const syntaxChips = [
  { key: 'user', label: '@ user', trigger: '@', wrap: false, online: true },
  { key: 'puzzle', label: '# puzzle', trigger: '#', wrap: false, online: true },
  {
    key: 'spoiler',
    label: '|| spoiler ||',
    trigger: '||',
    wrap: true,
    online: false,
  },
] as const;

const classNames: MentionsInputClassNames = {
  control: 'border-0 bg-transparent rounded-md h-full',
  highlighter: 'p-2',
  input:
    'p-2 overflow-y-auto! text-base-content outline-none focus:outline-none placeholder:text-base-content/40',
  suggestions:
    'z-[100] min-w-0 overflow-hidden rounded-md border border-base-300 bg-base-200 text-base-content shadow-lg backdrop-blur-none top-auto! bottom-full! left-0! w-full! mb-2',
  suggestionsList:
    'm-0 max-h-64 list-none divide-y divide-base-300 overflow-y-auto scroll-py-1 p-0 focus:outline-none',
  suggestionItem:
    'cursor-pointer select-none px-3 py-1.5 text-sm text-base-content transition-colors hover:bg-base-300 data-[focused=true]:bg-primary data-[focused=true]:text-primary-content',
  suggestionHighlight: 'font-semibold text-inherit',
  suggestionsStatus:
    'px-4 py-2.5 text-left text-sm leading-relaxed text-base-content/60',
  loadingIndicator: 'flex justify-center py-3',
  loadingSpinner:
    'loading loading-bars inline-block bg-current text-base-content',
  loadingSpinnerElement: 'hidden',
};

export default memo(function MarkdownTextarea({
  ref,
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  inputClassName,
  autoResize = false,
  maxLength = 5000,
}: MarkdownTextareaProps) {
  const { isOnline } = useOnline();
  const inputRef = useRef<HTMLTextAreaElement>(null!);
  const mentionsRef = useRef<MentionsInputHandle>(null);
  const mergedClassNames = React.useMemo(
    () => ({ ...classNames, input: cn(classNames.input, inputClassName) }),
    [inputClassName]
  );

  const insertSyntax = useCallback((trigger: string, wrap: boolean) => {
    const textarea = inputRef.current;
    if (!wrap) {
      mentionsRef.current?.insertText(trigger);
      return;
    }
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? start;
    const selected = textarea ? textarea.value.slice(start, end) : '';
    mentionsRef.current?.insertText(`${trigger}${selected}${trigger}`);
    if (selected.length === 0) {
      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.selectionStart = textarea.selectionEnd =
          start + trigger.length;
      });
    }
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      insertText: content => mentionsRef.current?.insertText(content),
    }),
    []
  );

  return (
    <div className={cn('flex flex-col gap-1 min-w-0', className)}>
      <div
        role="toolbar"
        aria-label="Special syntax"
        className="flex gap-1 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-thin"
      >
        {syntaxChips
          .filter(chip => isOnline || !chip.online)
          .map(chip => (
            <button
              key={chip.key}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => insertSyntax(chip.trigger, chip.wrap)}
              className="badge badge-sm shrink-0 cursor-pointer whitespace-nowrap border-0 bg-base-300/60 text-base-content/70 font-mono hover:bg-base-300 hover:text-base-content"
            >
              {chip.label}
            </button>
          ))}
      </div>
      <MentionsInput
        ref={mentionsRef}
        value={value}
        inputRef={inputRef}
        onMentionsChange={change => onChange(change.value)}
        anchorMode="left"
        suggestionsPlacement="above"
        suggestionsPortalHost={null}
        autoResize={autoResize}
        placeholder={placeholder}
        maxLength={maxLength}
        className="flex-1 w-full bg-base-200 focus-within:bg-base-300 text-base-content text-sm rounded-md"
        classNames={mergedClassNames}
        onKeyDown={onKeyDown}
      >
        {isOnline
          ? [
              <Mention
                key="user"
                trigger="@"
                displayTransform={(_id, display) => `@${display}`}
                className="bg-accent/10 text-transparent border-b border-accent rounded-lg"
                data={async query => {
                  if (query.length === 0) {
                    return [];
                  }
                  const result = await api.userAutocomplete(query);
                  return result.map(r => ({
                    id: r.id,
                    display: r.name,
                  }));
                }}
                renderEmpty={() => 'No users found'}
                debounceMs={500}
                markup="[@__display__](/profile/__id__)"
              />,
              <Mention
                key="puzzle"
                trigger="#"
                displayTransform={(_id, display) => `#${display}`}
                className="bg-primary/10 text-transparent border-b border-primary rounded-lg"
                data={async query => {
                  if (query.length === 0) {
                    return [];
                  }
                  const result = await puzzleAutocomplete(query);
                  return result.map(r => ({
                    id: r.id,
                    display: r.title,
                  }));
                }}
                renderEmpty={() => 'No puzzles found'}
                debounceMs={500}
                markup="[#__display__](__id__)"
              />,
            ]
          : []}
      </MentionsInput>
    </div>
  );
});
