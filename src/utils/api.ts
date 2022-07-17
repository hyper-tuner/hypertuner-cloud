import { INI } from '@hyper-tuner/ini';
import { notification } from 'antd';
import store from '../store';
import stdDialogs from '../data/standardDialogs';
import help from '../data/help';
import { divider } from '../data/constants';
import {
  fetchWithProgress,
  onProgress as onProgressType,
} from './http';
import TuneParser from './tune/TuneParser';
import { TuneDbDocument } from '../types/dbData';
import useServerStorage, { CDN_URL } from '../hooks/useServerStorage';

// TODO: refactor this!!
export const loadTune = async (tuneData: TuneDbDocument | null, bucketId: string) => {
  if (tuneData === null) {
    store.dispatch({ type: 'config/load', payload: null });
    store.dispatch({ type: 'tune/load', payload: null });
    return;
  }

  const pako = await import('pako');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { getFileForDownload, getINIFile } = useServerStorage();

  const started = new Date();
  const tuneRaw = await getFileForDownload(tuneData.tuneFileId!, bucketId);

  const tuneParser = new TuneParser()
    .parse(pako.inflate(new Uint8Array(tuneRaw)));

  if (!tuneParser.isValid()) {
    console.error('Invalid tune');
    notification.error({ message: 'Error', description: 'Tune file is not valid!' });

    return;
  }

  const tune = tuneParser.getTune();
  const iniRaw = tuneData.customIniFileId ? getFileForDownload(tuneData.customIniFileId, bucketId) : getINIFile(tuneData.signature);
  const buff = pako.inflate(new Uint8Array(await iniRaw));
  const config = new INI(buff).parse().getResults();

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
  console.info(loadingTimeInfo);

  store.dispatch({ type: 'config/load', payload: config });
  store.dispatch({ type: 'tune/load', payload: tune });
  store.dispatch({ type: 'status', payload: loadingTimeInfo });
};

export const loadLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    `${CDN_URL}/public/temp/long.mlg.gz`,
    onProgress,
    signal,
  ).then((response) => response);

export const loadCompositeLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    `${CDN_URL}/public/temp/composite_1.csv.gz`,
    onProgress,
    signal,
  ).then((response) => response);

export const loadToothLogs = (onProgress?: onProgressType, signal?: AbortSignal) =>
  fetchWithProgress(
    `${CDN_URL}/public/temp/tooth_3.csv.gz`,
    onProgress,
    signal,
  ).then((response) => response);
