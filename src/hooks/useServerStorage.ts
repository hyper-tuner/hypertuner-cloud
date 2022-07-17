import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  ref,
  getBytes,
  getStorage,
} from 'firebase/storage';
import { Models } from 'appwrite';
import { storage } from '../appwrite';
import { fetchEnv } from '../utils/env';

const PUBLIC_PATH = 'public';
const INI_PATH = `${PUBLIC_PATH}/ini`;
export const CDN_URL = fetchEnv('VITE_CDN_URL');

const fireBaseStorage = getStorage();

export type ServerFile = Models.File;

const genericError = (error: Error) => notification.error({ message: 'Storage Error', description: error.message });

const fetchFromServer = async (path: string): Promise<ArrayBuffer> => {
  if (CDN_URL) {
    const response = await fetch(`${CDN_URL}/${path}`);
    return Promise.resolve(response.arrayBuffer());
  }

  return Promise.resolve(await getBytes(ref(fireBaseStorage, path)));
};

const useServerStorage = () => {
  const getINIFile = async (signature: string) => {
    const { version, baseVersion } = /.+?(?<version>(?<baseVersion>\d+)(-\w+)*)/.exec(signature)?.groups || { version: null, baseVersion: null };

    try {
      return fetchFromServer(`${INI_PATH}/${version}.ini.gz`);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);

      notification.warning({
        message: 'INI not found',
        description: `INI version: "${version}" not found. Trying base version: "${baseVersion}"!`,
      });

      try {
        return fetchFromServer(`${INI_PATH}/${baseVersion}.ini.gz`);
      } catch (err) {
        Sentry.captureException(err);
        console.error(err);

        notification.error({
          message: 'INI not found',
          description: `INI version: "${baseVersion}" not found. Try uploading custom INI file!`,
        });
      }

      return Promise.reject(error);
    }
  };

  const removeFile = async (bucketId: string, fileId: string) => {
    try {
      await storage.deleteFile(bucketId, fileId);
      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const uploadFile = async (userId: string, bucketId: string, file: File) => {
    try {
      const createdFile = await storage.createFile(
        bucketId,
        'unique()',
        file,
        ['role:all'],
        [`user:${userId}`],
      );

      return Promise.resolve(createdFile);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getFile = async (id: string, bucketId: string) => {
    try {
      const file = await storage.getFile(bucketId, id);

      return Promise.resolve(file);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getFileForDownload = async (id: string, bucketId: string) => {
    try {
      const file = storage.getFileView(bucketId, id);
      const response = await fetch(file.href);

      return Promise.resolve(response.arrayBuffer());
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  return {
    getFile: (id: string, bucketId: string): Promise<Models.File> => getFile(id, bucketId),
    getINIFile: (signature: string): Promise<ArrayBuffer> => getINIFile(signature),
    removeFile: (bucketId: string, fileId: string): Promise<void> => removeFile(bucketId, fileId),
    getFileForDownload: (bucketId: string, fileId: string): Promise<ArrayBuffer> => getFileForDownload(bucketId, fileId),
    uploadFile: (userId: string, bucketId: string, file: File): Promise<ServerFile> => uploadFile(userId, bucketId, file),
  };
};

export default useServerStorage;
