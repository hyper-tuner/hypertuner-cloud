import PocketBase from 'pocketbase';
// import { fetchEnv } from './utils/env';


const client = new PocketBase('http://localhost:8090');

export {
  // eslint-disable-next-line import/prefer-default-export
  client,
};
