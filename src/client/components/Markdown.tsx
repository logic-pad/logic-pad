import React, {
  ReactNode,
  Suspense,
  lazy,
  memo,
  useMemo,
  useState,
} from 'react';
import { r } from 'readable-regexp';
import { cn } from '../../client/uiHelper.ts';
import Loading from './Loading';
import type { Options } from 'react-markdown';
import { spoilerPlugin } from 'remark-inline-spoiler';
import { useOnline } from '../contexts/OnlineContext.tsx';

export interface MarkdownProps extends Readonly<Options> {
  className?: string;
  inline?: boolean;
  onClick?: React.MouseEventHandler;
  onClickCapture?: React.MouseEventHandler;
}

const profileUrlRegex = r
  .match(
    r.lineStart,
    r.exactly`/profile/`,
    r.capture.oneOrMore.notCharIn('/', r.whitespace),
    r.maybe`/`,
    r.lineEnd
  )
  .toRegExp();

const UserMention = memo(function UserMention({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { isOnline, me } = useOnline();
  const isMe = useMemo(
    () => isOnline && me && profileUrlRegex.exec(href)?.[1] === me.id,
    [isOnline, me, href]
  );
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'bg-accent/10 border-b border-accent rounded-lg no-underline!',
        isMe
          ? 'bg-accent text-accent-content'
          : 'bg-accent/10 text-neutral-content'
      )}
    >
      {children}
    </a>
  );
});

const MarkdownAsync = lazy(async () => {
  const { default: Markdown } = await import('react-markdown');

  const baseProps: Partial<MarkdownProps> = {
    remarkPlugins: [spoilerPlugin],
    remarkRehypeOptions: {
      handlers: {
        spoiler: (_: any, node: { value: string }) => {
          return {
            type: 'element',
            tagName: 'spoiler',
            properties: {},
            children: [
              {
                type: 'text',
                value: node.value,
              },
            ],
          };
        },
      },
    } as MarkdownProps['remarkRehypeOptions'],
  };

  const baseComponents: MarkdownProps['components'] = {
    spoiler: function Spoiler({ children }: { children: any }) {
      const [revealSpoilers, setRevealSpoilers] = useState(false);
      return (
        <MarkdownAsync
          className={cn(
            'spoiler',
            revealSpoilers && 'spoiler-reveal cursor-default!'
          )}
          inline={true}
          onClickCapture={e => {
            if (revealSpoilers) return;
            e.preventDefault();
            e.stopPropagation();
            setRevealSpoilers(true);
          }}
        >
          {children}
        </MarkdownAsync>
      );
    },
    a: function Link({ href, children }: { href?: string; children: any }) {
      if (href?.startsWith('/profile/') && String(children).startsWith('@')) {
        return <UserMention href={href}>{children}</UserMention>;
      }
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  } as MarkdownProps['components'];

  const inlineComponents: MarkdownProps['components'] = {
    ...baseComponents,
    p: 'span',
    div: 'span',
  };

  return {
    default: memo(function MarkdownAsync({
      className,
      inline,
      onClick,
      onClickCapture,
      ...mdProps
    }: MarkdownProps) {
      inline = inline ?? false;
      if (inline) {
        return (
          <span
            className={cn(
              'prose max-w-full',
              className,
              (!!onClick || !!onClickCapture) && 'cursor-pointer'
            )}
            onClick={onClick}
            onClickCapture={onClickCapture}
          >
            <Markdown
              {...baseProps}
              components={inline ? inlineComponents : baseComponents}
              {...mdProps}
            />
          </span>
        );
      } else {
        return (
          <div
            className={cn(
              'prose max-w-full',
              className,
              (!!onClick || !!onClickCapture) && 'cursor-pointer'
            )}
            onClick={onClick}
            onClickCapture={onClickCapture}
          >
            <Markdown
              {...baseProps}
              components={inline ? inlineComponents : baseComponents}
              {...mdProps}
            />
          </div>
        );
      }
    }),
  };
});

export default memo(function Markdown(props: MarkdownProps) {
  return (
    <Suspense fallback={<Loading className="h-5 w-20" />}>
      <MarkdownAsync {...props} />
    </Suspense>
  );
});
