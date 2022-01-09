import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  storage,
  storageRef,
  getBytes,
} from '../firebase';

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

  return {
    getFile: (path: string): Promise<ArrayBuffer> => getFile(path),
  };
};

export default useServerStorage;
