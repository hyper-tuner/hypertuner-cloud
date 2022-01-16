import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import { Timestamp } from 'firebase/firestore';
import {
  fireStoreDoc,
  getDoc,
  setDoc,
  db,
} from '../firebase';
import { TuneDbData } from '../types/dbData';

const TUNES_PATH = 'publicTunes';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useDb = () => {
  const getData = async (tuneId: string) => {
    try {
      const tune = (await getDoc(fireStoreDoc(db, TUNES_PATH, tuneId))).data() as TuneDbData;
      const processed = {
        ...tune,
        createdAt: (tune?.createdAt as Timestamp)?.toDate().toISOString(),
        updatedAt: (tune?.updatedAt as Timestamp)?.toDate().toISOString(),
      };

      return Promise.resolve(processed);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const updateData = async (tuneId: string, data: TuneDbData) => {
    try {
      await setDoc(fireStoreDoc(db, TUNES_PATH, tuneId), data, { merge: true });

      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    getTune: (tuneId: string): Promise<TuneDbData> => getData(tuneId),
    updateData: (tuneId: string, data: TuneDbData): Promise<void> => updateData(tuneId, data),
  };
};

export default useDb;
