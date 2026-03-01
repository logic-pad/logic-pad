import React from 'react';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import { allSymbols as allSymbolData } from '@logic-pad/core/data/symbols/index';

export interface SymbolProps<T extends Symbol> {
  textClass: string;
  symbol: T;
}

export interface SymbolInfo {
  readonly component: React.NamedExoticComponent<SymbolProps<Symbol>>;
  readonly prototype: Symbol;
}

const modules = import.meta.glob<{
  default?: React.NamedExoticComponent<SymbolProps<Symbol>>;
  id?: string;
}>(['./**/*.tsx', '!./Symbol.tsx'], {
  eager: true,
});

const allSymbols = new Map<string, SymbolInfo>();

function register<T extends Symbol>(
  prototype: T,
  component: React.NamedExoticComponent<SymbolProps<T>>
) {
  allSymbols.set(prototype.id, {
    component: component as React.NamedExoticComponent<SymbolProps<Symbol>>,
    prototype,
  });
}

Object.values(modules).forEach(module => {
  if ('default' in module && 'id' in module && module.default && module.id) {
    const { default: component, id } = module;
    const symbol = allSymbolData.get(id);
    if (symbol) {
      register(symbol, component);
    }
  }
});

export { allSymbols };
