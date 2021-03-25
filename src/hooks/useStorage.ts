import { useMemo } from 'react';
import Storage from '../utils/storage';

const useStorage = () => {
  const storage = useMemo(() => new Storage(), []);

  return {
    storageGet: (key: string) => storage.get(key),
    storageGetSync: (key: string) => storage.getSync(key),
    storageSet: (key: string, value: string) => storage.set(key, value),
  };
};

export default useStorage;
