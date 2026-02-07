import { clsx, type ClassValue } from 'clsx';
import toast from 'react-hot-toast';
import { extendTailwindMerge } from 'tailwind-merge';
import { HighlightColor } from './online/data';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['glow-md', 'glow-xl', 'glow-3xl'] }],
    },
  },
});

export function getHighlightColor(highlight?: HighlightColor) {
  switch (highlight) {
    case 'primary':
      return 'bg-primary/5 border-primary outline-primary shadow-primary';
    case 'secondary':
      return 'bg-secondary/5 border-secondary outline-secondary shadow-secondary';
    case 'accent':
      return 'bg-accent/5 border-accent outline-accent shadow-accent';
    case 'info':
      return 'bg-info/5 border-info outline-info shadow-info';
    case 'success':
      return 'bg-success/5 border-success outline-success shadow-success';
    case 'error':
      return 'bg-error/5 border-error outline-error shadow-error';
    default:
      return '';
  }
}

const relativeTimeFormat = new Intl.RelativeTimeFormat('en');

export function toRelativeDate(
  date: Date,
  accuracy: 'second' | 'day' = 'second'
) {
  const msOffset = date.getTime() - Date.now();
  const absOffset = Math.abs(msOffset);
  if (absOffset < 10 * 1000 && accuracy === 'second') {
    return msOffset < 0 ? 'a few seconds ago' : 'in a few seconds';
  } else if (absOffset < 60 * 1000 && accuracy === 'second') {
    return relativeTimeFormat.format(Math.round(msOffset / 1000), 'second');
  } else if (absOffset < 60 * 60 * 1000 && accuracy === 'second') {
    return relativeTimeFormat.format(
      Math.round(msOffset / 1000 / 60),
      'minute'
    );
  } else if (absOffset < 24 * 60 * 60 * 1000 && accuracy === 'second') {
    return relativeTimeFormat.format(
      Math.round(msOffset / 1000 / 60 / 60),
      'hour'
    );
  } else if (absOffset < 24 * 60 * 60 * 1000) {
    return 'today';
  } else if (absOffset < 30 * 24 * 60 * 60 * 1000) {
    return relativeTimeFormat.format(
      Math.round(msOffset / 1000 / 60 / 60 / 24),
      'day'
    );
  } else if (absOffset < 365 * 24 * 60 * 60 * 1000 || msOffset > 0) {
    return relativeTimeFormat.format(
      Math.round(msOffset / 1000 / 60 / 60 / 24 / 30),
      'month'
    );
  } else {
    return relativeTimeFormat.format(
      Math.round(msOffset / 1000 / 60 / 60 / 24 / 365),
      'year'
    );
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pluralize(count: number) {
  return (strings1: TemplateStringsArray, count1?: number) => {
    return (strings2: TemplateStringsArray, count2?: number) => {
      const singular =
        count2 === 1 || (count1 !== undefined && count1 !== 1)
          ? strings2
          : strings1;
      const plural = singular === strings1 ? strings2 : strings1;
      const strings = count === 1 ? singular : plural;
      if (strings.length === 1) return `${count} ${strings[0].trim()}`;
      return strings[0] + count.toString() + strings[1];
    };
  };
}

/**
 * Maximum count from database is 5000. Display "5000+" for anything above that.
 * @param count
 */
export function count(count: number | null | undefined, max = 5000) {
  if (count === null || count === undefined) return '';
  return count >= max ? `${max}+` : count.toString();
}

const epsilon = 0.001;

export function eq(a: number, b: number) {
  return Math.abs(a - b) < epsilon;
}

export const externalReducedMotion = () =>
  // @ts-expect-error for browser support
  window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
  window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

export const mousePosition = { clientX: 0, clientY: 0 };

const updateMousePosition = (e: PointerEvent) => {
  mousePosition.clientX = e.clientX;
  mousePosition.clientY = e.clientY;
};

document.addEventListener('pointermove', updateMousePosition);
document.addEventListener('pointerdown', updateMousePosition);
document.addEventListener('pointerup', updateMousePosition);
document.addEventListener('pointerleave', updateMousePosition);
document.addEventListener('pointerenter', updateMousePosition);
document.addEventListener('pointerover', updateMousePosition);
document.addEventListener('pointerout', updateMousePosition);

export const safeClipboard = {
  writeText: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error(
        'Failed to write to clipboard. Please allow clipboard access.'
      );
    }
  },
  write: async (items: ClipboardItem[]) => {
    try {
      await navigator.clipboard.write(items);
    } catch {
      toast.error(
        'Failed to write to clipboard. Please allow clipboard access.'
      );
    }
  },
  readText: async () => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  },
};
