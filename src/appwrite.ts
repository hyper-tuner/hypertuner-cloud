import {
  Account,
  Client,
  Databases,
  Storage,
} from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT as string)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID as string);

const account = new Account(client);
const database = new Databases(client, import.meta.env.VITE_APPWRITE_DATABASE_ID as string);
const storage = new Storage(client);

export {
  client,
  account,
  database,
  storage,
};
