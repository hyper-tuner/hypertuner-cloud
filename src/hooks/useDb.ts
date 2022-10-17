import * as Sentry from '@sentry/browser';
import {
  ID,
  Models,
  Permission,
  Query,
  Role,
} from 'appwrite';
import { databases } from '../appwrite';
import {
  client,
  formatError,
} from '../pocketbase';
import {
  TuneDbData,
  UsersBucket,
  TuneDbDataPartial,
} from '../types/dbData';
import { databaseGenericError } from '../pages/auth/notifications';
import {
  Collections,
  TunesRecord,
} from '../@types/pocketbase-types';

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
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getTune = async (tuneId: string) => {
    try {
      const tune = await client.records.getList(Collections.Tunes, 1, 1, {
        filter: `tuneId = "${tuneId}"`,
        expand: 'userProfile',
      });

      return Promise.resolve(tune.totalItems > 0 ? tune.items[0] as TunesRecord : null);
    } catch (error) {
      Sentry.captureException(error);
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
      databaseGenericError(error as Error);

      return Promise.reject(error);
    }
  };

  const searchTunes = async (search?: string) => {
    // TODO: add pagination
    const batchSide = 100;
    const phrases = search ? search.replace(/ +(?= )/g,'').split(' ') : [];
    const filter = phrases
      .filter((phrase) => phrase.length > 1)
      .map((phrase) => `textSearch ~ "${phrase}"`)
      .join(' || ');

    try {
      const list = await client.records.getFullList(Collections.Tunes, batchSide, {
        sort: '-created',
        filter,
        expand: 'userProfile',
      });

      return Promise.resolve(list as TunesRecord[]);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  return {
    updateTune: (tuneId: string, data: TuneDbDataPartial): Promise<void> => updateTune(tuneId, data),
    createTune: (data: TuneDbData): Promise<Models.Document> => createTune(data),
    getTune: (tuneId: string): Promise<TunesRecord | null> => getTune(tuneId),
    searchTunes: (search?: string): Promise<TunesRecord[]> => searchTunes(search),
    getBucketId: (userId: string): Promise<string> => getBucketId(userId),
  };
};

export default useDb;
