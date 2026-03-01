import React, { createContext, memo, use, useEffect, useState } from 'react';

interface Features {
  instructions: boolean;
  metadata: boolean;
  checklist: boolean;
  saveControl: boolean;
  preview: boolean;
}

interface EmbedContext {
  features: Features;
  embedChildren: string[];
  setFeatures: (value: Features) => void;
  setEmbedChildren: (
    value: string[] | ((children: string[]) => string[])
  ) => void;
  isTopLevel: boolean;
}

const Context = createContext<EmbedContext>({
  features: {
    instructions: true,
    metadata: true,
    checklist: true,
    saveControl: true,
    preview: true,
  },
  embedChildren: [],
  setFeatures: () => {},
  setEmbedChildren: () => {},
  isTopLevel: true,
});

export const useEmbed = () => {
  return use(Context);
};

export const EmbedConsumer = Context.Consumer;

export default memo(function EmbedContext({
  name,
  children,
  features: initialFeatures,
}: {
  name: string;
  children: React.ReactNode;
  features?: Features | (() => Features);
}) {
  const [features, setFeatures] = useState<Features>(
    initialFeatures ?? {
      instructions: true,
      metadata: true,
      checklist: true,
      saveControl: true,
      preview: true,
    }
  );
  const { setEmbedChildren } = useEmbed();
  const [embedChildrenOnSelf, setEmbedChildrenOnSelf] = useState<string[]>([]);

  useEffect(() => {
    const currentName = name;
    setEmbedChildren(children => [...children, currentName]);
    return () => {
      setEmbedChildren(children => children.filter(k => k !== currentName));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Context
      value={{
        features,
        setFeatures,
        embedChildren: embedChildrenOnSelf,
        setEmbedChildren: setEmbedChildrenOnSelf,
        isTopLevel: embedChildrenOnSelf.length === 0,
      }}
    >
      {children}
    </Context>
  );
});
