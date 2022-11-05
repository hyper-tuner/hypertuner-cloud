import * as Sentry from '@sentry/browser';
import {
  client,
  formatError,
  ClientResponseError,
  API_URL,
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

type TunesResponseList = {
  items: TunesResponse[];
  totalItems: number;
}

const tunesCollection = client.collection(Collections.Tunes);

const customEndpoint = `${API_URL}/api/custom`;

const useDb = () => {
  const updateTune = async (id: string, data: TunesRecordPartial): Promise<void> => {
    try {
      await tunesCollection.update(id, data);
      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const createTune = async (data: TunesRecord): Promise<TunesResponse> => {
    try {
      const record = await tunesCollection.create<TunesResponse>(data);

      return Promise.resolve(record);
    } catch (error) {
      Sentry.captureException(error);
      databaseGenericError(new Error(formatError(error)));

      return Promise.reject(error);
    }
  };

  const getTune = async (tuneId: string): Promise<TunesResponse | null> => {
    const response = await fetch(`${customEndpoint}/tunes/byTuneId/${tuneId}`);

    if (response.ok) {
      return response.json();
    }

    if (response.status === 404) {
      return Promise.resolve(null);
    }

    Sentry.captureException(response);
    databaseGenericError(new Error(response.statusText));

    return Promise.reject(response.status);
  };

  const getIni = async (signature: string): Promise<IniFilesResponse | null> => {
    const response = await fetch(`${customEndpoint}/iniFiles/bySignature/${signature}`);

    if (response.ok) {
      return response.json();
    }

    if (response.status === 404) {
      return Promise.resolve(null);
    }

    Sentry.captureException(response);
    databaseGenericError(new Error(response.statusText));

    return Promise.reject(response.status);
  };

  const searchTunes = async (search: string, page: number, perPage: number): Promise<TunesResponseList> => {
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

  const getUserTunes = async (userId: string, page: number, perPage: number): Promise<TunesResponseList> => {
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

  const autocomplete = async (attribute: string, search: string): Promise<TunesResponse[]> => {
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
    updateTune,
    createTune,
    getTune,
    getIni,
    searchTunes,
    getUserTunes,
    autocomplete,
  };
};

export default useDb;
