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
  getFirestore,
} from 'firebase/firestore/lite';
import { Models, Query } from 'appwrite';
import appwrite from '../appwrite';
import { TuneDbData, UsersBucket } from '../types/dbData';
import { databaseGenericError } from '../pages/auth/notifications';

const TUNES_PATH = 'publicTunes';
const COLLECTION_ID_TUNES = import.meta.env.VITE_APPWRITE_COLLECTION_ID_PUBLIC_TUNES;
const COLLECTION_ID_USERS_BUCKETS = import.meta.env.VITE_APPWRITE_COLLECTION_ID_USERS_BUCKETS;
const db = getFirestore();

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
      databaseGenericError(error as Error);

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
      databaseGenericError(error as Error);

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
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  const createTune = async (data: TuneDbData) => {
    try {
      const tune = await appwrite.database.createDocument(
        COLLECTION_ID_TUNES,
        'unique()',
        data,
        ['role:all'],
        [`user:${data.userId}`],
      );

      return Promise.resolve(tune);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getBucketId = async (userId: string) => {
    try {
      const buckets = await appwrite.database.listDocuments(
        COLLECTION_ID_USERS_BUCKETS,
        [
          Query.equal('userId', userId),
          Query.equal('visibility', 'public'),
        ],
        1,
      );

      if (buckets.total === 0) {
        throw new Error('No public bucket found');
      }

      return Promise.resolve((buckets.documents[0] as unknown as UsersBucket)!.bucketId);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    updateData: (tuneId: string, data: TuneDbData): Promise<void> => updateData(tuneId, data),
    createTune: (data: TuneDbData): Promise<Models.Document> => createTune(data),
    getTune: (tuneId: string): Promise<TuneDbData> => getTuneData(tuneId),
    // listTunes: (): Promise<QuerySnapshot<TuneDbData>> => listTunesData(),
    listTunes: (): Promise<QuerySnapshot<any>> => listTunesData(),
    getBucketId: (userId: string): Promise<string> => getBucketId(userId),
  };
};

export default useDb;
