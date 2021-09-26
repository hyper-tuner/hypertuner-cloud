import locations from '../data/s3-edge-locations.json';

type LocationsType = { [index: string]: string };

export type onProgress = (percent: number, total: number, edgeLocation: string | null) => void;

export const fetchWithProgress = async (url: string, onProgress?: onProgress, signal?: AbortSignal): Promise<ArrayBuffer> => {
  const response = await fetch(url, { signal });
  const contentLength = response.headers.get('Content-Length');
  const isContentEncoded = response.headers.has('Content-Encoding');
  const edgeLocationCode = response.headers.get('x-amz-cf-pop');
  let edgeLocation = null;

  if (edgeLocationCode) {
    // simplify location code (`MEL50-C1` => `MEL`)
    edgeLocation = (locations as LocationsType)[edgeLocationCode.slice(0, 3)];
  }

  if (!contentLength || isContentEncoded) {
    // fallback to full buffer
    return response.arrayBuffer();
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
      onProgress(~~(at / length * 100), length, edgeLocation);
    }
  }

  return array.buffer;
};
