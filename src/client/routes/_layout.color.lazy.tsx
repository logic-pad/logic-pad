import { createLazyFileRoute } from '@tanstack/react-router';
import { memo, useEffect, useMemo, useState } from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { FaPaintBrush } from 'react-icons/fa';
import ColorPicker from '../components/ColorPicker';
import useColor, { formatCss } from '@terrazzo/use-color';
import { useTheme } from '../contexts/ThemeContext';

const THEME_COLOR_NAMES = [
  'neutral',
  'neutral-content',
  'base-100',
  'base-200',
  'base-300',
  'base-content',
  'primary',
  'primary-content',
  'secondary',
  'secondary-content',
  'accent',
  'accent-content',
  'info',
  'info-content',
  'success',
  'success-content',
  'error',
  'error-content',
] as const;

export const Route = createLazyFileRoute('/_layout/color')({
  component: memo(function ColorPageLazy() {
    const [enabled, setEnabled] = useState(false);
    const { theme } = useTheme();
    const [selectedColor, setSelectedColor] =
      useState<(typeof THEME_COLOR_NAMES)[number]>('neutral');
    const reactiveColors = Object.fromEntries(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      THEME_COLOR_NAMES.map(name => [name, useColor('oklch(0 0 0)')])
    );

    useEffect(() => {
      setEnabled(false);
    }, [theme]);

    useEffect(() => {
      if (enabled) return;
      const styles = window.getComputedStyle(document.documentElement);
      for (const name of THEME_COLOR_NAMES) {
        const colorValue =
          styles.getPropertyValue(`--color-${name}`).trim() ||
          (name.includes('content') ? 'oklch(1 0 0)' : 'oklch(0 0 0)');
        reactiveColors[name][1](colorValue);
      }
      setEnabled(true);
    }, [enabled, reactiveColors]);

    const selectedColorValue = reactiveColors[selectedColor][0];
    const setSelectedColorValue = reactiveColors[selectedColor][1];

    const css = useMemo(
      () =>
        enabled
          ? `
:root {
  --color-neutral: ${formatCss(reactiveColors.neutral[0].oklch)};
  --color-neutral-content: ${formatCss(reactiveColors['neutral-content'][0].oklch)};
  --color-base-100: ${formatCss(reactiveColors['base-100'][0].oklch)};
  --color-base-200: ${formatCss(reactiveColors['base-200'][0].oklch)};
  --color-base-300: ${formatCss(reactiveColors['base-300'][0].oklch)};
  --color-base-content: ${formatCss(reactiveColors['base-content'][0].oklch)};
  --color-primary: ${formatCss(reactiveColors.primary[0].oklch)};
  --color-primary-content: ${formatCss(reactiveColors['primary-content'][0].oklch)};
  --color-secondary: ${formatCss(reactiveColors.secondary[0].oklch)};
  --color-secondary-content: ${formatCss(reactiveColors['secondary-content'][0].oklch)};
  --color-accent: ${formatCss(reactiveColors.accent[0].oklch)};
  --color-accent-content: ${formatCss(reactiveColors['accent-content'][0].oklch)};
  --color-info: ${formatCss(reactiveColors.info[0].oklch)};
  --color-info-content: ${formatCss(reactiveColors['info-content'][0].oklch)};
  --color-success: ${formatCss(reactiveColors.success[0].oklch)};
  --color-success-content: ${formatCss(reactiveColors['success-content'][0].oklch)};
  --color-error: ${formatCss(reactiveColors.error[0].oklch)};
  --color-error-content: ${formatCss(reactiveColors['error-content'][0].oklch)};
}
          `
          : '',
      [enabled, reactiveColors]
    );
    return (
      <ResponsiveLayout>
        <div className="flex flex-col mt-8 items-center justify-between flex-wrap gap-12">
          <style>{css}</style>
          <div className="text-3xl self-start">
            <FaPaintBrush className="inline-block me-4" />
            Color Palette
          </div>
          <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 flex flex-col items-stretch">
              <div
                className="bg-neutral text-neutral-content flex-3 flex flex-col gap-4 justify-center font-bold px-12 cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('neutral')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('neutral-content');
                  }}
                >
                  Neutral
                </span>
                <span className="flex gap-2 pointer-events-none">
                  <span className="w-8 h-8 rounded-md bg-black"></span>
                  <span className="w-8 h-8 rounded-md bg-white"></span>
                  <span className="w-8 h-8 rounded-md bg-neutral-content/20"></span>
                </span>
              </div>
              <div
                className="bg-base-100 text-base-content flex-1 flex items-center font-bold px-12 cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('base-100')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('base-content');
                  }}
                >
                  Base-100
                </span>
              </div>
              <div
                className="bg-base-200 text-base-content flex-1 flex items-center font-bold px-12 cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('base-200')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('base-content');
                  }}
                >
                  Base-200
                </span>
              </div>
              <div
                className="bg-base-300 text-base-content flex-1 flex items-center font-bold px-12 cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('base-300')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('base-content');
                  }}
                >
                  Base-300
                </span>
              </div>
            </div>
            <div className="absolute inset-0 flex gap-12 px-12 py-4 items-stretch justify-around pointer-events-none">
              <div className="bg-transparent flex-1"></div>
              <div
                className="bg-primary text-primary-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('primary')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('primary-content');
                  }}
                >
                  Primary
                </span>
              </div>
              <div
                className="bg-secondary text-secondary-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('secondary')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('secondary-content');
                  }}
                >
                  Secondary
                </span>
              </div>
              <div
                className="bg-accent text-accent-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('accent')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('accent-content');
                  }}
                >
                  Accent
                </span>
              </div>
              <div
                className="bg-info text-info-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('info')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('info-content');
                  }}
                >
                  Info
                </span>
              </div>
              <div
                className="bg-success text-success-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('success')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('success-content');
                  }}
                >
                  Success
                </span>
              </div>
              <div
                className="bg-error text-error-content flex-1 rounded-lg flex items-center justify-center font-bold pointer-events-auto cursor-pointer hover:brightness-125"
                onClick={() => setSelectedColor('error')}
              >
                <span
                  className="cursor-pointer hover:underline"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColor('error-content');
                  }}
                >
                  Error
                </span>
              </div>
            </div>
          </div>
          <div className="w-full flex gap-12">
            <div className="flex flex-col gap-2 bg-base-100 text-base-content p-4 rounded-md shadow-lg">
              <span className="capitalize">{selectedColor}</span>
              <ColorPicker
                color={selectedColorValue}
                setColor={setSelectedColorValue}
              />
            </div>
            <div className="flex-1 bg-base-100 text-base-content p-4 rounded-md shadow-lg overflow-auto">
              <pre>{css.trim().replace(/undefined/g, '0')}</pre>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }),
});
