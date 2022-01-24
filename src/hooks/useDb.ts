import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  Timestamp,
  doc,
  getDoc,
  setDoc,
  collection,
  where,
  query,
  getDocs,
  QuerySnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TuneDbData } from '../types/dbData';

const TUNES_PATH = 'publicTunes';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useDb = () => {
  const getTuneData = async (tuneId: string) => {
    try {
      const tune = (await getDoc(doc(db, TUNES_PATH, tuneId))).data() as TuneDbData;
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

  const listTunesData = async () => {
    try {
      const tunesRef = collection(db, TUNES_PATH);
      const q = query(
        tunesRef,
        where('isPublished', '==', true),
        where('isListed', '==', true),
        orderBy('createdAt', 'desc'),
      );

      return Promise.resolve(await getDocs(q));
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const updateData = async (tuneId: string, data: TuneDbData) => {
    try {
      await setDoc(doc(db, TUNES_PATH, tuneId), data, { merge: true });

      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    updateData: (tuneId: string, data: TuneDbData): Promise<void> => updateData(tuneId, data),
    getTune: (tuneId: string): Promise<TuneDbData> => getTuneData(tuneId),
    listTunes: (): Promise<QuerySnapshot<TuneDbData>> => listTunesData(),
  };
};

export default useDb;
