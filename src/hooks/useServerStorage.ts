import Pako from 'pako';
import * as Sentry from '@sentry/browser';
import { API_URL, removeFilenameSuffix } from '../pocketbase';
import { Collections } from '../@types/pocketbase-types';
import useDb from './useDb';
import { fetchWithProgress, OnProgress } from '../utils/http';
import { downloading } from '../pages/auth/notifications';

const useServerStorage = () => {
  const { getIni } = useDb();

  const buildFileUrl = (collection: Collections, recordId: string, filename: string) =>
    `${API_URL}/api/files/${collection}/${recordId}/${filename}`;

  const fetchTuneFile = async (recordId: string, filename: string): Promise<ArrayBuffer> => {
    const response = await fetch(buildFileUrl(Collections.Tunes, recordId, filename));

    return Pako.inflate(new Uint8Array(await response.arrayBuffer()));
  };

  const fetchINIFile = async (signature: string): Promise<ArrayBuffer> => {
    // const { version, baseVersion } = /.+?(?<version>(?<baseVersion>\d+)(-\w+)*)/.exec(signature)?.groups || { version: null, baseVersion: null };
    const ini = await getIni(signature);

    if (!ini) {
      const msg = `Signature: "${signature}" not supported`;
      const error = new Error(msg);
      Sentry.captureException(error);

      return Promise.reject(error);
    }

    const response = await fetch(buildFileUrl(Collections.IniFiles, ini.id, ini.file));

    return Pako.inflate(new Uint8Array(await response.arrayBuffer()));
  };

  const fetchLogFileWithProgress = (
    recordId: string,
    filename: string,
    onProgress?: OnProgress,
    signal?: AbortSignal,
  ) =>
    fetchWithProgress(buildFileUrl(Collections.Tunes, recordId, filename), onProgress, signal).then(
      (response) => response,
    );

  const downloadFile = async (
    collection: Collections,
    recordId: string,
    filename: string,
    anchorRef: HTMLAnchorElement,
  ) => {
    downloading();

    const response = await fetch(buildFileUrl(collection, recordId, filename));
    const data = Pako.inflate(new Uint8Array(await response.arrayBuffer()));
    const url = window.URL.createObjectURL(new Blob([data]));

    anchorRef.href = url;

    anchorRef.target = '_blank';

    anchorRef.download = removeFilenameSuffix(filename);
    anchorRef.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    fetchTuneFile: (recordId: string, filename: string): Promise<ArrayBuffer> =>
      fetchTuneFile(recordId, filename),
    fetchINIFile: (signature: string): Promise<ArrayBuffer> => fetchINIFile(signature),
    fetchLogFileWithProgress: (
      recordId: string,
      filename: string,
      onProgress?: OnProgress,
      signal?: AbortSignal,
    ): Promise<ArrayBuffer> => fetchLogFileWithProgress(recordId, filename, onProgress, signal),
    downloadFile: (
      collection: Collections,
      recordId: string,
      filename: string,
      anchorRef: HTMLAnchorElement,
    ): Promise<void> => downloadFile(collection, recordId, filename, anchorRef),
  };
};

export default useServerStorage;
