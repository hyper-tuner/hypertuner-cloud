import {
  Account,
  Client,
  Databases,
  Storage,
} from 'appwrite';
import { fetchEnv } from './utils/env';

const client = new Client();

client
  .setEndpoint(fetchEnv('VITE_APPWRITE_ENDPOINT'))
  .setProject('hyper-tuner-cloud');

const account = new Account(client);
const database = new Databases(client, 'public');
const storage = new Storage(client);

export {
  client,
  account,
  database,
  storage,
};
