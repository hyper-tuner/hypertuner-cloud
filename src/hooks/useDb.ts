import * as Sentry from '@sentry/browser';
import {
  Timestamp,
  doc,
  getDoc,
  collection,
  where,
  query,
  getDocs,
  QuerySnapshot,
  orderBy,
  getFirestore,
} from 'firebase/firestore/lite';
import {
  Models,
  Query,
} from 'appwrite';
import { database } from '../appwrite';
import {
  TuneDbDataLegacy,
  TuneDbData,
  UsersBucket,
  TuneDbDataPartial,
  TuneDbDocument,
} from '../types/dbData';
import { databaseGenericError } from '../pages/auth/notifications';
import { fetchEnv } from '../utils/env';

const TUNES_PATH = 'publicTunes';
const COLLECTION_ID_TUNES = fetchEnv('VITE_APPWRITE_COLLECTION_ID_PUBLIC_TUNES');
const COLLECTION_ID_USERS_BUCKETS = fetchEnv('VITE_APPWRITE_COLLECTION_ID_USERS_BUCKETS');

const db = getFirestore();

const useDb = () => {
  const getTuneLegacy = async (tuneId: string) => {
    try {
      const tune = (await getDoc(doc(db, TUNES_PATH, tuneId))).data() as TuneDbDataLegacy;
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

  const updateTune = async (documentId: string, data: TuneDbDataPartial) => {
    try {
      await database.updateDocument(COLLECTION_ID_TUNES, documentId, data);

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
      const tune = await database.createDocument(
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

  const getTune = async (tuneId: string) => {
    try {
      const tune = await database.listDocuments(
        COLLECTION_ID_TUNES,
        [Query.equal('tuneId', tuneId)],
        1,
      );

      return Promise.resolve(tune.total > 0 ? tune.documents[0] as unknown as TuneDbDocument : null);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getBucketId = async (userId: string) => {
    try {
      const buckets = await database.listDocuments(
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
    updateTune: (tuneId: string, data: TuneDbDataPartial): Promise<void> => updateTune(tuneId, data),
    createTune: (data: TuneDbData): Promise<Models.Document> => createTune(data),
    getTuneLegacy: (tuneId: string): Promise<TuneDbDataLegacy> => getTuneLegacy(tuneId),
    getTune: (tuneId: string): Promise<TuneDbDocument | null> => getTune(tuneId),
    // listTunes: (): Promise<QuerySnapshot<TuneDbData>> => listTunesData(),
    listTunes: (): Promise<QuerySnapshot<any>> => listTunesData(),
    getBucketId: (userId: string): Promise<string> => getBucketId(userId),
  };
};

export default useDb;
