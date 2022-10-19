import PocketBase from 'pocketbase';
import { fetchEnv } from './utils/env';

const API_URL = fetchEnv('VITE_POCKETBASE_API_URL');
const client = new PocketBase(API_URL);

const formatError = (error: any) => {
  const { data, message } = error;

  if (data.data) {
    const errors = Object.keys(data.data).map((key) => `${key.toUpperCase()}: ${data.data[key].message}`);
    if (errors.length > 0) {
      return errors.join(', ');
    }
  }

  return message;
};

const removeFilenameSuffix = (filename: string) => filename.replace(/(.+)(_\w{10})(\.\w+)$/, '$1$3');

// NOTE: PocketBase doesn't return ISO time, this may change here: https://github.com/pocketbase/pocketbase/issues/376
const formatTime = (time: string) => new Date(`${time}Z`).toLocaleString();

export {
  API_URL,
  client,
  formatError,
  formatTime,
  removeFilenameSuffix,
};
