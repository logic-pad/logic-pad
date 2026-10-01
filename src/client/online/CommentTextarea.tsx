import React, {
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  MentionsInput,
  Mention,
  type MentionsInputHandle,
  MentionsInputClassNames,
} from 'react-mentions-ts';
import { api } from './api';
import { PuzzleAutocomplete } from './data';
import { offlineLinkRegex, onlineLinkRegex } from '../uiHelper';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';

export type CommentTextareaRef = {
  sendComment: () => void;
  prependMention: (userName: string, userId: string) => void;
  focus: () => void;
};

export interface CommentTextareaProps {
  ref?: React.Ref<CommentTextareaRef>;
  defaultValue?: string;
  onPostComment?: (comment: string) => void;
}

const puzzleAutocomplete = async (q: string): Promise<PuzzleAutocomplete[]> => {
  const offlineLinks = q.matchAll(offlineLinkRegex);
  console.log(offlineLinks);
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
  { key: 'user', label: '@ user', trigger: '@', wrap: false },
  { key: 'puzzle', label: '# puzzle', trigger: '#', wrap: false },
  { key: 'spoiler', label: '|| spoiler ||', trigger: '||', wrap: true },
] as const;

const classNames: MentionsInputClassNames = {
  control: 'border-0 bg-transparent rounded-md',
  highlighter: 'p-2',
  input:
    'p-2 min-h-12 max-h-30 overflow-y-auto! text-base-content outline-none focus:outline-none placeholder:text-base-content/40',
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

export default memo(function CommentTextarea({
  ref,
  defaultValue,
  onPostComment,
}: CommentTextareaProps) {
  const [content, setContent] = useState(defaultValue ?? '');
  const inputRef = useRef<HTMLTextAreaElement>(null!);
  const mentionsRef = useRef<MentionsInputHandle>(null);
  const sendComment = useCallback(() => {
    if (content.length > 0) {
      onPostComment?.(content.trim());
    }
    setContent('');
  }, [content, onPostComment]);
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
      sendComment,
      prependMention: (userName, userId) => {
        setContent(prev => {
          if (!prev.startsWith(`[@${userName}](/profile/${userId})`)) {
            return `[@${userName}](/profile/${userId}) ${prev}`;
          }
          return prev;
        });
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }),
    [sendComment]
  );

  return (
    <div className="flex flex-col gap-1 min-w-0 grow">
      <div
        role="toolbar"
        aria-label="Special syntax"
        className="flex gap-1 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-thin"
      >
        {syntaxChips.map(chip => (
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
        value={content}
        inputRef={inputRef}
        onMentionsChange={change => setContent(change.value)}
        anchorMode="left"
        suggestionsPlacement="above"
        suggestionsPortalHost={null}
        autoResize
        placeholder="Add a comment..."
        maxLength={5000}
        className="w-full bg-base-200 focus-within:bg-base-300 text-base-content text-sm rounded-md"
        classNames={classNames}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendComment();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            mentionsRef.current?.insertText('\n');
          }
        }}
      >
        <Mention
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
        />
        <Mention
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
        />
      </MentionsInput>
    </div>
  );
});
