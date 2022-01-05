import { Config as ConfigType } from '@speedy-tuner/types';
import store from '../store';
import stdDialogs from '../data/standardDialogs';
import help from '../data/help';
import { divider } from '../data/constants';
import {
  fetchWithProgress,
  onProgress as onProgressType,
} from './http';
import TuneParser from './tune/TuneParser';

export const loadAll = async () => {
  const started = new Date();
  // const version = 202012;
  const version = 202103;

  const json: ConfigType = await fetch(`./tunes/${version}.json`)
    .then((response) => response.json());

  const tuneRaw = await fetch(`./tunes/${version}.msq`);
  const tuneParser = new TuneParser().parse(await tuneRaw.arrayBuffer());

  if (!tuneParser.isValid()) {
    console.error('Invalid tune');
  }

  const config = json;

  // override / merge standard dialogs, constants and help
  config.dialogs = {
    ...config.dialogs,
    ...stdDialogs,
  };
  config.help = {
    ...config.help,
    ...help,
  };
  config.constants.pages[0].data.divider = divider;

  const loadingTimeInfo = `Tune loaded in ${(new Date().getTime() - started.getTime())}ms`;
  console.log(loadingTimeInfo);

  store.dispatch({ type: 'config/load', payload: config });
  store.dispatch({ type: 'tune/load', payload: tuneParser.getTune() });
  store.dispatch({
    type: 'status',
    payload: loadingTimeInfo,
  });
};

export const loadLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    // 'https://speedytuner-cloud.s3.eu-west-2.amazonaws.com/logs/longest.mlg.gz',
    // 'https://d29mjpbgm6k6md.cloudfront.net/logs/longest.mlg.gz',
    'https://d29mjpbgm6k6md.cloudfront.net/logs/middle.mlg.gz',
    // 'https://d29mjpbgm6k6md.cloudfront.net/logs/markers.mlg.gz',
    onProgress,
    signal,
  ).then((response) => response);

export const loadCompositeLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    'https://d29mjpbgm6k6md.cloudfront.net/trigger-logs/composite_1_2.csv.gz',
    // 'https://d29mjpbgm6k6md.cloudfront.net/trigger-logs/composite_miata.csv.gz',
    // 'https://d29mjpbgm6k6md.cloudfront.net/trigger-logs/2.csv.gz',
    onProgress,
    signal,
  ).then((response) => response);

export const loadToothLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    'https://d29mjpbgm6k6md.cloudfront.net/trigger-logs/tooth_3.csv.gz',
    onProgress,
    signal,
  ).then((response) => response);
