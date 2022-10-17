import { notification } from 'antd';
import Pako from 'pako';
import * as Sentry from '@sentry/browser';
import { fetchEnv } from '../utils/env';
import { API_URL } from '../pocketbase';
import { Collections } from '../@types/pocketbase-types';

const PUBLIC_PATH = 'public';
const INI_PATH = `${PUBLIC_PATH}/ini`;
export const CDN_URL = fetchEnv('VITE_CDN_URL');

const fetchFromServer = async (path: string): Promise<ArrayBuffer> => {
  const response = await fetch(`${CDN_URL}/${path}`);
  return Promise.resolve(response.arrayBuffer());
};

const fetchFileFromServer = async (recordId: string, filename: string, inflate = true): Promise<ArrayBuffer> => {
  const response = await fetch(`${API_URL}/api/files/${Collections.Tunes}/${recordId}/${filename}`);

  if (inflate) {
    return Pako.inflate(new Uint8Array(await response.arrayBuffer()));
  }

  return response.arrayBuffer();
};

const useServerStorage = () => {
  const getINIFile = async (signature: string) => {
    const { version, baseVersion } = /.+?(?<version>(?<baseVersion>\d+)(-\w+)*)/.exec(signature)?.groups || { version: null, baseVersion: null };

    try {
      return Pako.inflate(new Uint8Array(await fetchFromServer(`${INI_PATH}/${version}.ini.gz`)));
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

  return {
    getINIFile: (signature: string): Promise<ArrayBuffer> => getINIFile(signature),
    fetchFileFromServer: (recordId: string, filename: string): Promise<ArrayBuffer> => fetchFileFromServer(recordId, filename),
  };
};

export default useServerStorage;
