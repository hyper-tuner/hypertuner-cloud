import {
  Config as ConfigType,
  Constant,
  DatalogEntry,
  OutputChannel,
  Page as PageType,
  SimpleConstant,
} from '@hyper-tuner/types';
import { useMemo } from 'react';

const findConstantOnPage = (config: ConfigType, fieldName: string): Constant => {
  const foundPage =
    config.constants.pages.find((page: PageType) => fieldName in page.data) ||
    ({ data: {} } as PageType);

  if (!foundPage) {
    throw new Error(`Constant [${fieldName}] not found`);
  }

  return foundPage.data[fieldName];
};

const findOutputChannel = (config: ConfigType, name: string): OutputChannel | SimpleConstant => {
  const result = config.outputChannels[name];
  if (!result) {
    throw new Error(`Output channel [${name}] not found`);
  }

  return result;
};

const findDatalogNameByLabel = (config: ConfigType, label: string): string => {
  const found = Object.keys(config.datalog).find(
    (name: string) => config.datalog[name].label === label,
  );
  if (!found) {
    throw new Error(`Datalog entry [${label}] not found`);
  }

  return found;
};

const findDatalog = (config: ConfigType, name: string): DatalogEntry => {
  const result = config.datalog[name];
  if (!result) {
    throw new Error(`Datalog entry [${name}] not found`);
  }

  return result;
};

const useConfig = (config: ConfigType | null) =>
  // biome-ignore lint/nursery/useHookAtTopLevel: False positive
  useMemo(
    () => ({
      isConfigReady: !!config?.constants,
      findOutputChannel: (name: string) => findOutputChannel(config!, name),
      findConstantOnPage: (name: string) => findConstantOnPage(config!, name),
      findDatalogNameByLabel: (label: string) => findDatalogNameByLabel(config!, label),
      findDatalog: (name: string) => findDatalog(config!, name),
    }),
    [config],
  );

export default useConfig;
