import PocketBase, { AuthMethodsList, AuthProviderInfo, ClientResponseError } from 'pocketbase';
import { TypedPocketBase } from './@types/pocketbase-types';
import { fetchEnv } from './utils/env';

const API_URL = fetchEnv('VITE_POCKETBASE_API_URL');
const client = new PocketBase(API_URL) as TypedPocketBase;

const formatError = (error: ClientResponseError) => {
  const { data, message } = error;

  if (data.data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const errors = Object.keys(data.data).map(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (key) => `${key.toUpperCase()}: ${data.data[key].message}`,
    );
    if (errors.length > 0) {
      return errors.join(', ');
    }
  }

  return message;
};

const removeFilenameSuffix = (filename: string) =>
  filename.replace(/(.+)(_\w{10})(\.\w+)$/, '$1$3');

export {
  API_URL,
  client,
  formatError,
  removeFilenameSuffix,
  ClientResponseError,
  type AuthMethodsList,
  type AuthProviderInfo,
};
