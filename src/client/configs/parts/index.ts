import React from 'react';
import { AnyConfig, ConfigType } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';

export interface ConfigProps<T extends AnyConfig> {
  configurable: Configurable;
  config: T;
  setConfig?: (field: string, value: T['default']) => void;
}

const modules = import.meta.glob<{
  default?: React.NamedExoticComponent<ConfigProps<any>>;
  type?: ConfigType;
}>(['./**/*.tsx', '!./Config.tsx'], {
  eager: true,
});

const allConfigs = new Map<
  ConfigType,
  React.NamedExoticComponent<ConfigProps<any>>
>();

function register(
  key: ConfigType,
  component: React.NamedExoticComponent<ConfigProps<any>>
) {
  allConfigs.set(key, component);
}

Object.values(modules).forEach(module => {
  if (
    'default' in module &&
    'type' in module &&
    module.default &&
    module.type
  ) {
    const { default: component, type } = module;
    register(type, component);
  }
});

export { allConfigs };
