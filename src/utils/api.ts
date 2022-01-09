import { INI } from '@speedy-tuner/ini';
import pako from 'pako';
import store from '../store';
import stdDialogs from '../data/standardDialogs';
import help from '../data/help';
import { divider } from '../data/constants';
import {
  fetchWithProgress,
  onProgress as onProgressType,
} from './http';
import TuneParser from './tune/TuneParser';

export const loadTune = async (tuneRaw: ArrayBuffer, iniRaw: ArrayBuffer) => {
  const started = new Date();

  const tuneParser = new TuneParser()
    .parse(pako.inflate(new Uint8Array(tuneRaw)));

  if (!tuneParser.isValid()) {
    // TODO: capture exception
    console.error('Invalid tune');
  }

  const buff = pako.inflate(new Uint8Array(iniRaw));
  const config = new INI((new TextDecoder()).decode(buff)).parse();

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
