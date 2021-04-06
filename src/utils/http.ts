export type onProgress = (percent: number, total: number) => void;

export const fetchWithProgress = async (url: string, onProgress?: onProgress, signal?: AbortSignal): Promise<Uint8Array> => {
  const response = await fetch(url, { signal });
  const contentLength = response.headers.get('Content-Length');

  if (!contentLength) {
    throw new Error('Missing Content-Length while fetching');
  }

  const reader = response.body!.getReader();
  const length = Number(contentLength);
  const array = new Uint8Array(length);

  let at = 0;
  for (; ;) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    array.set(value as Uint8Array, at);
    at += (value as Uint8Array).length;

    if (onProgress) {
      // eslint-disable-next-line no-bitwise
      onProgress(~~(at / length * 100), length);
    }
  }

  return array;
};
