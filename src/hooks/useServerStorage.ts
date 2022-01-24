import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  UploadTask,
  ref,
  getBytes,
  deleteObject,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../firebase';

const BASE_PATH = 'public/users';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useServerStorage = () => {
  const getFile = async (path: string) => {
    try {
      const buffer = await getBytes(ref(storage, path));

      return Promise.resolve(buffer);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const removeFile = async (path: string) => {
    try {
      await deleteObject(ref(storage, path));

      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const uploadFile = (path: string, file: File, data: Uint8Array) =>
    uploadBytesResumable(ref(storage, path), data, {
      customMetadata: {
        name: file.name,
        size: `${file.size}`,
      },
    });

  return {
    getFile: (path: string): Promise<ArrayBuffer> => getFile(path),
    removeFile: (path: string): Promise<void> => removeFile(path),
    uploadFile: (path: string, file: File, data: Uint8Array): UploadTask => uploadFile(path, file, data),
    basePathForFile: (userUuid: string, tuneId: string, fileName: string): string => `${BASE_PATH}/${userUuid}/tunes/${tuneId}/${fileName}`,
  };
};

export default useServerStorage;
