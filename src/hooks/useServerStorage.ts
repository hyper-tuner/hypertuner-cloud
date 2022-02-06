import { notification } from 'antd';
import * as Sentry from '@sentry/browser';
import {
  UploadTask,
  ref,
  getBytes,
  deleteObject,
  uploadBytesResumable,
  getStorage,
} from 'firebase/storage';

const PUBLIC_PATH = 'public';
const USERS_PATH = `${PUBLIC_PATH}/users`;
const INI_PATH = `${PUBLIC_PATH}/ini`;

const storage = getStorage();

const genericError = (error: Error) => notification.error({ message: 'Storage Error', description: error.message });

const useServerStorage = () => {
  const getFile = async (path: string) => {
    try {
      return Promise.resolve(await getBytes(ref(storage, path)));
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);

      return Promise.reject(error);
    }
  };

  const getINIFile = async (signature: string) => {
    const { version, baseVersion } = /.+?(?<version>(?<baseVersion>\d+)(-\w+)*)/.exec(signature)?.groups || { version: null, baseVersion: null };

    try {
      return Promise.resolve(await getBytes(ref(storage, `${INI_PATH}/${version}.ini.gz`)));
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);

      notification.warning({
        message: 'INI not found',
        description: `INI version: "${version}" not found. Trying base version: "${baseVersion}"!` ,
      });

      try {
        return Promise.resolve(await getBytes(ref(storage, `${INI_PATH}/${baseVersion}.ini.gz`)));
      // eslint-disable-next-line @typescript-eslint/no-shadow
      } catch (error) {
        Sentry.captureException(error);
        console.error(error);

        notification.error({
          message: 'INI not found',
          description: `INI version: "${baseVersion}" not found. Try uploading custom INI file!` ,
        });
      }

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
    getINIFile: (signature: string): Promise<ArrayBuffer> => getINIFile(signature),
    removeFile: (path: string): Promise<void> => removeFile(path),
    uploadFile: (path: string, file: File, data: Uint8Array): UploadTask => uploadFile(path, file, data),
    basePathForFile: (userUuid: string, tuneId: string, fileName: string): string => `${USERS_PATH}/${userUuid}/tunes/${tuneId}/${fileName}`,
  };
};

export default useServerStorage;
