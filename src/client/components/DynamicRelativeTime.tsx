import { memo, useEffect, useState } from 'react';
import { toRelativeDate } from '../uiHelper';

export default memo(function DynamicRelativeTime({ time }: { time: Date }) {
  const [relativeTime, setRelativeTime] = useState(() =>
    toRelativeDate(time, 'exact')
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(toRelativeDate(time, 'exact'));
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);
  return relativeTime;
});
