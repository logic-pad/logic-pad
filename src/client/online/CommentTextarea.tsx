import {
  memo,
  Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import MarkdownTextarea, {
  MarkdownTextareaProps,
  MarkdownTextareaRef,
} from './MarkdownTextarea';

export type CommentTextareaRef = {
  submit: () => void;
  prependMention: (userName: string, userId: string) => void;
  focus: () => void;
};
export interface CommentTextareaProps
  extends Omit<
    MarkdownTextareaProps,
    | 'ref'
    | 'value'
    | 'onChange'
    | 'onKeyDown'
    | 'className'
    | 'inputClassName'
    | 'autoResize'
  > {
  ref?: Ref<CommentTextareaRef>;
  defaultValue?: string;
  onSubmit?: (content: string) => void;
}

export default memo(function CommentTextarea({
  ref,
  onSubmit,
  defaultValue,
  ...props
}: CommentTextareaProps) {
  const [content, setContent] = useState(defaultValue ?? '');
  const inputRef = useRef<MarkdownTextareaRef>(null);
  const submit = useCallback(() => {
    if (content.length > 0) {
      onSubmit?.(content.trim());
    }
    setContent('');
  }, [content, onSubmit]);
  useImperativeHandle(
    ref,
    () => ({
      submit,
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
    [submit]
  );

  return (
    <MarkdownTextarea
      ref={inputRef}
      className="grow"
      inputClassName="min-h-12 max-h-30"
      autoResize
      value={content}
      onChange={setContent}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          submit();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          inputRef.current?.insertText('\n');
        }
      }}
      {...props}
    />
  );
});
