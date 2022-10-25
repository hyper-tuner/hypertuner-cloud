import * as Sentry from '@sentry/browser';
import {
  client,
  formatError,
} from '../pocketbase';
import {
  IniFilesRecordFull,
  TunesRecordFull,
  TunesRecordPartial,
} from '../types/dbData';
import { databaseGenericError } from '../pages/auth/notifications';
import {
  Collections,
  TunesRecord,
} from '../@types/pocketbase-types';

const useDb = () => {
  const updateTune = async (id: string, data: TunesRecordPartial) => {
    try {
      await client.records.update(Collections.Tunes, id, data);
      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const createTune = async (data: TunesRecord) => {
    try {
      const record = await client.records.create(Collections.Tunes, data);

      return Promise.resolve(record as TunesRecordFull);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getTune = async (tuneId: string) => {
    try {
      const tune = await client.records.getList(Collections.Tunes, 1, 1, {
        filter: `tuneId = "${tuneId}"`,
        expand: 'userProfile',
      });

      return Promise.resolve(tune.totalItems > 0 ? tune.items[0] as TunesRecordFull : null);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getIni = async (signature: string) => {
    try {
      const tune = await client.records.getList(Collections.IniFiles, 1, 1, {
        filter: `signature = "${signature}"`,
      });

      return Promise.resolve(tune.totalItems > 0 ? tune.items[0] as IniFilesRecordFull : null);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const searchTunes = async (search: string, page: number, perPage: number) => {
    const phrases = search.length > 0 ? search.replace(/ +(?= )/g,'').split(' ') : [];
    const filter = phrases
      .filter((phrase) => phrase.length > 1)
      .map((phrase) => `textSearch ~ "${phrase}"`)
      .join(' || ');

    try {
      const list = await client.records.getList(Collections.Tunes, page, perPage, {
        sort: '-created',
        filter,
        expand: 'userProfile',
      });

      return Promise.resolve({
        items: list.items as TunesRecordFull[],
        totalItems: list.totalItems,
      });
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  return {
    updateTune: (tuneId: string, data: TunesRecordPartial): Promise<void> => updateTune(tuneId, data),
    createTune: (data: TunesRecord): Promise<TunesRecordFull> => createTune(data),
    getTune: (tuneId: string): Promise<TunesRecordFull | null> => getTune(tuneId),
    getIni: (tuneId: string): Promise<IniFilesRecordFull | null> => getIni(tuneId),
    searchTunes: (search: string, page: number, perPage: number): Promise<{ items: TunesRecordFull[]; totalItems: number }> => searchTunes(search, page, perPage),
  };
};

export default useDb;
