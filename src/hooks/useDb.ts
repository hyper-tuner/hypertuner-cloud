import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  fireStoreDoc,
  getDoc,
  db,
} from '../firebase';
import { TuneDbData } from '../types/dbData';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useDb = () => {
  const getDbData = async (tuneId: string, collection: string) => {
    try {
      const tune = (await getDoc(fireStoreDoc(db, collection, tuneId))).data() as TuneDbData;

      return Promise.resolve(tune);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    getTune: (tuneId: string): Promise<TuneDbData> => getDbData(tuneId, 'tunes'),
  };
};

export default useDb;
