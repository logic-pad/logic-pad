import React from 'react';

const modules = import.meta.glob<React.NamedExoticComponent>(['./**/*.tsx'], {
  eager: true,
  import: 'default',
});

const allTools = Object.values(modules);

export { allTools };
