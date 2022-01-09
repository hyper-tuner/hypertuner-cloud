import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  fireStoreDoc,
  getDoc,
  setDoc,
  db,
} from '../firebase';
import { TuneDbData } from '../types/dbData';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useDb = () => {
  const getData = async (tuneId: string, collection: string) => {
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

  const updateData = async (tuneId: string, collection: string, data: TuneDbData) => {
    try {
      await setDoc(fireStoreDoc(db, collection, tuneId), data, { merge: true });

      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    getTune: (tuneId: string): Promise<TuneDbData> => getData(tuneId, 'tunes'),
    updateData: (tuneId: string, data: TuneDbData): Promise<void> => updateData(tuneId, 'tunes', data),
  };
};

export default useDb;
