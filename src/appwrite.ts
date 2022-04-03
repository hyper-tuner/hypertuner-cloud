import { Appwrite } from 'appwrite';

const appwrite = new Appwrite();

appwrite
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT as string)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID as string);

export default appwrite;
