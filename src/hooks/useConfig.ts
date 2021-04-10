import { useMemo } from 'react';
import {
  Config as ConfigType,
  Page as PageType,
  Constant,
  OutputChannel,
  SimpleConstant,
} from '../types/config';

export const findConstantOnPage = (config: ConfigType, fieldName: string): Constant => {
  const foundPage = config
    .constants
    .pages
    .find((page: PageType) => fieldName in page.data) || { data: {} } as PageType;

  if (!foundPage) {
    throw new Error(`Constant [${fieldName}] not found`);
  }

  return foundPage.data[fieldName];
};

export const findOutputChannel = (config: ConfigType, name: string): OutputChannel | SimpleConstant => {
  const result = config.outputChannels[name];

  if (!result) {
    throw new Error(`Output channel [${name}] not found`);
  }

  return result;
};

export const findDatalogNameByLabel = (config: ConfigType, label: string): string => {
  const found = Object.keys(config.datalog).find((name: string) => config.datalog[name].label === label);

  if (!found) {
    throw new Error('Datalog entry not found');
  }

  return found;
};

export const findOutputChannelByDatalogLabel = (config: ConfigType, label: string): OutputChannel | SimpleConstant =>
  findOutputChannel(config, findDatalogNameByLabel(config, label));


const useConfig = (config: ConfigType) => useMemo(() => ({
  isConfigReady: !!config.constants,
  findOutputChannelByDatalogLabel: (label: string) => findOutputChannelByDatalogLabel(config, label),
  findConstantOnPage: (name: string) => findConstantOnPage(config, name),
}), [config]);

export default useConfig;
