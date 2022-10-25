import { INI } from '@hyper-tuner/ini';
import { notification } from 'antd';
import store from '../store';
import stdDialogs from '../data/standardDialogs';
import help from '../data/help';
import { divider } from '../data/constants';
import TuneParser from './tune/TuneParser';
import useServerStorage from '../hooks/useServerStorage';
import { TunesRecordFull } from '../types/dbData';
import { iniLoadingError } from '../pages/auth/notifications';

// TODO: refactor this!!
// eslint-disable-next-line import/prefer-default-export
export const loadTune = async (tuneData: TunesRecordFull | null) => {
  if (tuneData === null) {
    store.dispatch({ type: 'config/load', payload: null });
    store.dispatch({ type: 'tune/load', payload: null });

    return;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { fetchINIFile, fetchTuneFile } = useServerStorage();

  const tuneRaw = await fetchTuneFile(tuneData.id, tuneData.tuneFile);

  const tuneParser = new TuneParser().parse(tuneRaw);

  if (!tuneParser.isValid()) {
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

    store.dispatch({ type: 'config/load', payload: config });
    store.dispatch({ type: 'tune/load', payload: tune });
  } catch (error) {
    iniLoadingError((error as Error));
  }
};
