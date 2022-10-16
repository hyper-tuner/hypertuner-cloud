import PocketBase from 'pocketbase';
// import { fetchEnv } from './utils/env';


const API_URL = 'http://localhost:8090';
const client = new PocketBase(API_URL);

export {
  // eslint-disable-next-line import/prefer-default-export
  API_URL,
  client,
};
