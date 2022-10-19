import { INI } from '@hyper-tuner/ini';
import { notification } from 'antd';
import store from '../store';
import stdDialogs from '../data/standardDialogs';
import help from '../data/help';
import { divider } from '../data/constants';
import {
  fetchWithProgress,
  OnProgress,
} from './http';
import TuneParser from './tune/TuneParser';
import useServerStorage, { CDN_URL } from '../hooks/useServerStorage';
import { TunesRecordFull } from '../types/dbData';
import { iniLoadingError } from '../pages/auth/notifications';

// TODO: refactor this!!
export const loadTune = async (tuneData: TunesRecordFull | null) => {
  if (tuneData === null) {
    store.dispatch({ type: 'config/load', payload: null });
    store.dispatch({ type: 'tune/load', payload: null });

    return;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { fetchINIFile, fetchTuneFile } = useServerStorage();

  const started = new Date();
  const tuneRaw = await fetchTuneFile(tuneData.id, tuneData.tuneFile);

  const tuneParser = new TuneParser().parse(tuneRaw);

  if (!tuneParser.isValid()) {
    console.error('Invalid tune');
    notification.error({ message: 'Error', description: 'Tune file is not valid!' });

    return;
  }

  const tune = tuneParser.getTune();
  try {
    const iniRaw = tuneData.customIniFile ? fetchTuneFile(tuneData.id, tuneData.customIniFile) : fetchINIFile(tuneData.signature);
    const config = new INI(await iniRaw).parse().getResults();

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
  } catch (error) {
    iniLoadingError((error as Error));
  }
};

export const loadToothLogs = (onProgress?: OnProgress, signal?: AbortSignal) =>
  fetchWithProgress(
    `${CDN_URL}/public/temp/tooth_3.csv.gz`,
    onProgress,
    signal,
  ).then((response) => response);
