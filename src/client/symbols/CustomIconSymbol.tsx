import { Suspense, lazy, memo, useMemo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import CustomIconSymbolData from '@logic-pad/core/data/symbols/customIconSymbol';
import { IconBaseProps } from 'react-icons';
import Loading from '../components/Loading';

export interface CustomIconProps {
  textClass: string;
  symbol: CustomIconSymbolData;
}

const MdIcon = lazy(async () => {
  const Md = await import('react-icons/md');
  return {
    default: ({ icon, ...rest }: IconBaseProps & { icon: string }) => {
      let Icon = Md[icon as Exclude<keyof typeof Md, 'default'>];
      if (!Icon) Icon = Md.MdQuestionMark;
      return <Icon {...rest} />;
    },
  };
});

export default memo(function CustomIconSymbol({
  textClass,
  symbol,
}: CustomIconProps) {
  const textStyle = useMemo(
    () => ({
      transform: `rotate(${symbol.rotation}deg)`,
    }),
    [symbol.rotation]
  );
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <pre
        className={cn(
          'absolute m-auto font-[inherit] text-center text-[0.75em]',
          textClass
        )}
        style={textStyle}
        aria-hidden="true"
      >
        <Suspense fallback={<Loading />}>
          <MdIcon icon={symbol.icon} />
        </Suspense>
      </pre>
      <span className="sr-only">
        {`Custom icon ${symbol.icon} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'custom_icon';
