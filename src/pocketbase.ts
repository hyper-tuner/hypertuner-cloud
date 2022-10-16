import PocketBase, { ClientResponseError } from 'pocketbase';
// import { fetchEnv } from './utils/env';


const API_URL = 'http://localhost:8090';
const client = new PocketBase(API_URL);

const formatError = (error: any) => {
  const { data, message } = (error as ClientResponseError).data;
  const errors = Object.keys(data).map((key) => `${key.toUpperCase()}: ${data[key].message}`);

  if (errors.length > 0) {
    return errors.join(', ');
  }

  return message;
};

export {
  API_URL,
  client,
  formatError,
};
