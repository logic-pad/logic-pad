import { CSSProperties, memo, ReactNode, useId } from 'react';
import { Tooltip, type ITooltip, type PlacesType } from 'react-tooltip';

export type TooltipVariant = 'neutral' | 'info' | 'error' | 'accent';
export type TooltipPlace = PlacesType;

const tooltipIds: Record<TooltipVariant, string> = {
  neutral: 'app-tooltip-neutral',
  info: 'app-tooltip-info',
  error: 'app-tooltip-error',
  accent: 'app-tooltip-accent',
};

/**
 * Data attributes attaching an element to one of the global tooltip
 * instances rendered by {@link AppTooltips}. Tooltips with falsy or empty
 * content are never shown, mirroring DaisyUI's `data-tip` behavior.
 *
 * @example
 * <button {...tip('Save (Ctrl+S)', 'left')} />
 */
export function tip(
  content: string | number | false | null | undefined,
  place: TooltipPlace = 'top',
  variant: TooltipVariant = 'info'
) {
  return {
    'data-tooltip-id': tooltipIds[variant],
    'data-tooltip-content':
      content === false || content === '' || content === null
        ? undefined
        : content?.toString(),
    'data-tooltip-place': place,
  } as const;
}

const baseStyle: CSSProperties = {
  maxWidth: '20rem',
  borderRadius: 'var(--radius-field)',
  textAlign: 'center',
  zIndex: 9999,
};

const variantStyles: Record<TooltipVariant, CSSProperties> = {
  neutral: {
    backgroundColor: 'var(--color-neutral)',
    color: 'var(--color-neutral-content)',
  },
  info: {
    backgroundColor: 'var(--color-info)',
    color: 'var(--color-info-content)',
  },
  error: {
    backgroundColor: 'var(--color-error)',
    color: 'var(--color-error-content)',
  },
  accent: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-accent-content)',
  },
};

export interface StyledTooltipProps
  extends Omit<ITooltip, 'style' | 'variant' | 'opacity' | 'id'> {
  variant?: TooltipVariant;
  id?: string;
  style?: CSSProperties;
}

/**
 * A react-tooltip instance styled to look like a DaisyUI tooltip.
 * Rendered with `position: fixed` so it is never clipped by scrollable
 * or overflow-hidden ancestors. Prefer the global instances via
 * {@link tip} instead of rendering this directly.
 */
export const StyledTooltip = memo(function StyledTooltip({
  variant = 'info',
  id,
  style,
  ...props
}: StyledTooltipProps) {
  return (
    <Tooltip
      id={id ?? tooltipIds[variant]}
      positionStrategy="fixed"
      opacity={1}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      {...props}
    />
  );
});

/**
 * Global tooltip instances for every variant. Must be rendered once near
 * the app root, and once more inside every native `<dialog>` opened with
 * `showModal()` that contains tooltip anchors, because elements in the
 * top layer cover everything else on the page.
 */
export default memo(function AppTooltips() {
  return (
    <>
      {(Object.keys(tooltipIds) as TooltipVariant[]).map(variant => (
        <StyledTooltip key={variant} variant={variant} />
      ))}
    </>
  );
});

export interface FeedbackTooltipProps
  extends Omit<
    StyledTooltipProps,
    'content' | 'isOpen' | 'setIsOpen' | 'anchorSelect' | 'children'
  > {
  /** While set, a tooltip showing this message is forced open. */
  message: string | null;
  /** Content shown on hover while no message is set. Omit to disable hover tooltips. */
  content?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * A wrapper element with a transient feedback tooltip (e.g. "Copied!").
 * While {@link FeedbackTooltipProps.message} is set, a dedicated tooltip
 * instance is mounted and forced open, even when the anchor is not
 * hovered. Optionally, {@link FeedbackTooltipProps.content} is shown on
 * hover via the global tooltip instances otherwise.
 *
 * The feedback instance is deliberately only mounted while the message
 * exists: react-tooltip caches an empty position if a controlled tooltip
 * becomes rendered (e.g. via hover) before it has content, and never
 * recovers once content arrives.
 *
 * @example
 * <FeedbackTooltip className="flex-1" message={copied ? 'Copied!' : null} content="Copy link">
 *   <button onClick={copy}>Copy</button>
 * </FeedbackTooltip>
 */
export const FeedbackTooltip = memo(function FeedbackTooltip({
  message,
  content,
  place = 'top',
  variant = 'info',
  className,
  children,
  ...props
}: FeedbackTooltipProps) {
  const domId = useId();
  return (
    <div
      id={domId}
      className={className}
      {...(content !== undefined && message === null
        ? tip(content, place, variant)
        : {})}
    >
      {children}
      {message !== null && (
        <StyledTooltip
          anchorSelect={`#${domId}`}
          isOpen
          content={message}
          place={place}
          variant={variant}
          {...props}
        />
      )}
    </div>
  );
});
