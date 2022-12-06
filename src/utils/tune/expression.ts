import {
  Config as ConfigType,
  OutputChannels as OutputChannelsType,
  Page as ConfigPageType,
  SimpleConstant as SimpleConstantType,
  TuneConstants as TuneConstantsType,
} from '@hyper-tuner/types';
import * as Sentry from '@sentry/browser';

export const isExpression = (val: string | number) =>
  `${val}`.startsWith('{') && `${val}`.endsWith('}');

export const stripExpression = (val: string) => val.slice(1).slice(0, -1).trim();

export const isNumber = (val: string | number) => !Number.isNaN(Number(val));

// export const isNumber
// ochGetCommand
export const prepareConstDeclarations = (
  tuneConstants: TuneConstantsType,
  configPages: ConfigPageType[],
) =>
  Object.keys(tuneConstants)
    .map((constName: string) => {
      let val = tuneConstants[constName].value;

      // TODO: skip 2D and 3D maps for now
      if (typeof val === 'string' && val.includes('\n')) {
        return null;
      }

      // TODO: check whether we can limit this to a single page
      const constant = configPages.find((page: ConfigPageType) => constName in page.data)?.data[
        constName
      ];

      // we need array index instead of a display value
      if (constant?.type === 'bits') {
        val = (constant.values as string[]).indexOf(`${val}`);
      }

      // escape string values
      if (typeof val === 'string') {
        val = `'${val.replaceAll("'", "\\'")}'`;
      }

      // some names may have invalid characters, we can fix it or skip it
      const name = constName.replace('-', '_');

      return `const ${name} = ${val};`;
    })
    .filter((val) => val !== null);

const prepareChannelsDeclarations = (configOutputChannels: OutputChannelsType) =>
  Object.keys(configOutputChannels)
    .map((channelName: string) => {
      const current = configOutputChannels[channelName] as SimpleConstantType;
      if (!current.value) {
        return null;
      }

      let val = current.value;

      if (isExpression(val)) {
        val = stripExpression(val);
      } else if (!isNumber(val)) {
        val = `"${val}"`;
      }

      return `const ${channelName} = ${val};`;
    })
    .filter((val) => val !== null);

export const evaluateExpression = (
  expression: string,
  tuneConstants: TuneConstantsType,
  config: ConfigType,
) => {
  const constDeclarations = prepareConstDeclarations(tuneConstants, config.constants.pages);
  const channelsDeclarations = prepareChannelsDeclarations(config.outputChannels);

  try {
    // TODO: strip eval from `command` etc

    return eval(`
      'use strict';
      const arrayValue = (number, layout) => number;
      const array = {
        boardFuelOutputs: 4,
        boardIgnOutputs: 4,
      };
      const coolantRaw = 21;
      const iatRaw = 21;
      const fuelTempRaw = 21;
      const timeNow = new Date().getTime();
      const secl = 0;
      const tps = 0;
      const rpm = 0;
      const nSquirts = 1;
      const boostCutFuel = 0;
      const boostCutSpark = 0;
      const afr = 14.7;
      const afrTarget = 14.7;
      const map = 0;
      const loopsPerSecond = 0;
      const batCorrection = 0;
      const ASECurr = 0;
      const baro = 0;
      const vss = 0;
      const CLIdleTarget = 0;
      const fuelPressure = 0;
      const oilPressure = 0;
      const halfSync = 0;
      const sync = 0;

      ${constDeclarations.join('')}
      ${channelsDeclarations.join('')}
      ${stripExpression(expression)};
    `);
  } catch (error) {
    const msg = `Condition evaluation failed with: ${(error as Error).message}`;
    console.warn(msg);
    Sentry.captureMessage(msg);
  }

  return undefined;
};
