import * as Sentry from '@sentry/browser';
import {
  client,
  formatError,
  ClientResponseError,
} from '../pocketbase';
import { databaseGenericError } from '../pages/auth/notifications';
import {
  Collections,
  IniFilesResponse,
  TunesRecord,
  TunesResponse,
} from '../@types/pocketbase-types';

type Partial<T> = {
  [A in keyof T]?: T[A];
};

export type TunesRecordPartial = Partial<TunesRecord>;

const tunesCollection = client.collection(Collections.Tunes);
const iniFilesCollection = client.collection(Collections.IniFiles);

const useDb = () => {
  const updateTune = async (id: string, data: TunesRecordPartial) => {
    try {
      await tunesCollection.update(id, data);
      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const createTune = async (data: TunesRecord) => {
    try {
      const record = await tunesCollection.create<TunesResponse>(data);

      return Promise.resolve(record);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getTune = async (tuneId: string) => {
    try {
      const tune = await tunesCollection.getFirstListItem<TunesResponse>(
        `tuneId = "${tuneId}"`,
        {
          expand: 'author',
        },
      );

      return Promise.resolve(tune);
    } catch (error) {
      if ((error as ClientResponseError).isAbort) {
        return Promise.reject(new Error('Cancelled'));
      }

      if ((error as ClientResponseError).status === 404) {
        return Promise.resolve(null);
      }

      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getIni = async (signature: string) => {
    try {
      const ini = await iniFilesCollection.getFirstListItem<IniFilesResponse>(`signature = "${signature}"`);

      return Promise.resolve(ini);
    } catch (error) {
      if ((error as ClientResponseError).isAbort) {
        return Promise.reject(new Error('Cancelled'));
      }

      if ((error as ClientResponseError).status === 404) {
        return Promise.resolve(null);
      }

      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const searchTunes = async (search: string, page: number, perPage: number) => {
    const phrases = search.length > 0 ? search.replace(/ +(?= )/g, '').split(' ') : [];
    const filter = phrases
      .filter((phrase) => phrase.length > 1)
      .map((phrase) => `textSearch ~ "${phrase}" || author.username ~ "${phrase}"`)
      .join(' && ');

    try {
      const list = await tunesCollection.getList<TunesResponse>(page, perPage, {
        sort: '-updated',
        filter,
        expand: 'author',
      });

      return Promise.resolve({
        items: list.items,
        totalItems: list.totalItems,
      });
    } catch (error) {
      if ((error as ClientResponseError).isAbort) {
        return Promise.reject(new Error('Cancelled'));
      }

      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getUserTunes = async (userId: string, page: number, perPage: number) => {
    try {
      const list = await tunesCollection.getList<TunesResponse>(page, perPage, {
        sort: '-updated',
        filter: `author = "${userId}"`,
        expand: 'author',
      });

      return Promise.resolve({
        items: list.items,
        totalItems: list.totalItems,
      });
    } catch (error) {
      if ((error as ClientResponseError).isAbort) {
        return Promise.reject(new Error('Cancelled'));
      }

      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const autocomplete = async (attribute: string, search: string) => {
    try {
      const items = await tunesCollection.getFullList<TunesResponse>(10, {
        filter: `${attribute} ~ "${search}"`,
      });

      return Promise.resolve(items);
    } catch (error) {
      if ((error as ClientResponseError).isAbort) {
        return Promise.reject(new Error('Cancelled'));
      }

      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  return {
    updateTune: (tuneId: string, data: TunesRecordPartial): Promise<void> => updateTune(tuneId, data),
    createTune: (data: TunesRecord): Promise<TunesResponse> => createTune(data),
    getTune: (tuneId: string): Promise<TunesResponse | null> => getTune(tuneId),
    getIni: (tuneId: string): Promise<IniFilesResponse | null> => getIni(tuneId),
    searchTunes: (search: string, page: number, perPage: number): Promise<{ items: TunesResponse[]; totalItems: number }> => searchTunes(search, page, perPage),
    getUserTunes: (userId: string, page: number, perPage: number): Promise<{ items: TunesResponse[]; totalItems: number }> => getUserTunes(userId, page, perPage),
    autocomplete: (attribute: string, search: string): Promise<TunesResponse[]> => autocomplete(attribute, search),
  };
};

export default useDb;
