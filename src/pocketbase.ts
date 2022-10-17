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

export {
  API_URL,
  client,
  formatError,
};
