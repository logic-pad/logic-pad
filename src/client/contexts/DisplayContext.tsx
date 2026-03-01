import React, { createContext, memo, use, useState } from 'react';

interface DisplayContext {
  scale: number;
  setScale: (value: number) => void;
  responsiveScale: boolean;
  setResponsiveScale: (value: boolean) => void;
}

const Context = createContext<DisplayContext>({
  scale: 1,
  setScale: () => {},
  responsiveScale: true,
  setResponsiveScale: () => {},
});

export const useDisplay = () => {
  return use(Context);
};

export const DisplayConsumer = Context.Consumer;

export default memo(function DisplayContext({
  children,
  scale: externalScale,
  setScale: setExternalScale,
  responsiveScale: externalResponsiveScale,
  setResponsiveScale: setExternalResponsiveScale,
}: {
  children: React.ReactNode;
  scale?: number;
  setScale?: (value: number) => void;
  responsiveScale?: boolean;
  setResponsiveScale?: (value: boolean) => void;
}) {
  const [internalScale, setInternalScale] = useState(1);
  const scale = externalScale ?? internalScale;
  const setScale = setExternalScale ?? setInternalScale;

  const [internalResponsiveScale, setInternalResponsiveScale] = useState(true);
  const responsiveScale = externalResponsiveScale ?? internalResponsiveScale;
  const setResponsiveScale =
    setExternalResponsiveScale ?? setInternalResponsiveScale;

  return (
    <Context
      value={{
        scale,
        setScale,
        responsiveScale,
        setResponsiveScale,
      }}
    >
      {children}
    </Context>
  );
});
