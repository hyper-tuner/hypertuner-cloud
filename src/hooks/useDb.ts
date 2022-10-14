import * as Sentry from '@sentry/browser';
import {
  ID,
  Models,
  Permission,
  Query,
  Role,
} from 'appwrite';
import {
  databases,
  functions,
} from '../appwrite';
import {
  TuneDbData,
  UsersBucket,
  TuneDbDataPartial,
  TuneDbDocument,
} from '../types/dbData';
import { databaseGenericError } from '../pages/auth/notifications';

const DB_ID = 'public';
const COLLECTION_ID_PUBLIC_TUNES = 'tunes';
const COLLECTION_ID_USERS_BUCKETS = 'usersBuckets';

const useDb = () => {
  const updateTune = async (documentId: string, data: TuneDbDataPartial) => {
    try {
      await databases.updateDocument(DB_ID, COLLECTION_ID_PUBLIC_TUNES, documentId, data);

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
      const tune = await databases.createDocument(
        DB_ID,
        COLLECTION_ID_PUBLIC_TUNES,
        ID.unique(),
        data,
        [
          Permission.read(Role.any()),
          Permission.write(Role.user(data.userId, 'verified')),
        ],
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
      const tune = await databases.listDocuments(
        DB_ID,
        COLLECTION_ID_PUBLIC_TUNES,
        [
          Query.equal('tuneId', tuneId),
          Query.limit(1),
        ],
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
      const buckets = await databases.listDocuments(
        DB_ID,
        COLLECTION_ID_USERS_BUCKETS,
        [
          Query.equal('userId', userId),
          Query.equal('visibility', 'public'),
          Query.limit(1),
        ],
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

  const searchTunes = async (search?: string) => {
    // TODO: add pagination
    const limit = 100;

    try {
      const list: Models.DocumentList<TuneDbDocument> = await (
        search
          ? databases.listDocuments(DB_ID, COLLECTION_ID_PUBLIC_TUNES, [Query.search('textSearch', search), Query.limit(limit)])
          : databases.listDocuments(DB_ID, COLLECTION_ID_PUBLIC_TUNES, [Query.limit(limit)])
      );

      return Promise.resolve(list);
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
    getTune: (tuneId: string): Promise<TuneDbDocument | null> => getTune(tuneId),
    searchTunes: (search?: string): Promise<Models.DocumentList<TuneDbDocument>> => searchTunes(search),
    getBucketId: (userId: string): Promise<string> => getBucketId(userId),
    // TODO: refactor those executions
    getUser: (userId: string) => functions.createExecution('getUser', JSON.stringify({ userId })),
    listUsers: (userIds: string[]) => functions.createExecution('listUsers', JSON.stringify({ userIds })),
  };
};

export default useDb;
