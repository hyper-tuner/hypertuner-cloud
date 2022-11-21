import locations from '../data/edge-locations.json';

type LocationsType = { [index: string]: string };

export type OnProgress = (percent: number, total: number, edgeLocation: string | null) => void;

export const fetchWithProgress = async (
  url: string,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<ArrayBuffer> => {
  let edgeLocation = null;
  const response = await fetch(url, { signal });
  const contentLength = response.headers.get('Content-Length');
  const isContentEncoded = response.headers.has('Content-Encoding');
  // must be added to "Access-Control-Expose-Headers" in the response header
  const edgeLocationCode = response.headers.get('cf-ray');

  if (edgeLocationCode) {
    // eg. 6e33fc504a7dcc77-WAW
    const location = edgeLocationCode.split('-')[1];
    if (location) {
      edgeLocation = (locations as LocationsType)[location];
    }
  }

  if (!contentLength || isContentEncoded) {
    // fallback to full buffer
    return response.arrayBuffer();
  }

  const reader = response.body!.getReader();
  const length = Number(contentLength);
  const array = new Uint8Array(length);

  let at = 0;
  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    array.set(value as Uint8Array, at);
    at += (value as Uint8Array).length;

    if (onProgress) {
      onProgress(~~((at / length) * 100), length, edgeLocation);
    }
  }

  return array.buffer;
};
