import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import { UploadTask } from 'firebase/storage';
import {
  storage,
  storageRef,
  getBytes,
  deleteObject,
  uploadBytesResumable,
} from '../firebase';

const TUNES_PATH = 'public/users';

const genericError = (error: Error) => notification.error({ message: 'Database Error', description: error.message });

const useServerStorage = () => {
  const getFile = async (path: string) => {
    try {
      const buffer = await getBytes(storageRef(storage, path));

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
      await deleteObject(storageRef(storage, `${TUNES_PATH}/${path}`));

      return Promise.resolve();
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const uploadFile = (path: string, file: File, data: Uint8Array) =>
    uploadBytesResumable(storageRef(storage, `${TUNES_PATH}/${path}`), data, {
      customMetadata: {
        name: file.name,
        size: `${file.size}`,
      },
    });

  return {
    getFile: (path: string): Promise<ArrayBuffer> => getFile(path),
    removeFile: (path: string): Promise<void> => removeFile(path),
    uploadFile: (path: string, file: File, data: Uint8Array): UploadTask => uploadFile(path, file, data),
  };
};

export default useServerStorage;
