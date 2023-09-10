import Pako from 'pako';

export const compress = async (file: File) => Pako.gzip(await file.arrayBuffer(), { level: 9 });

export const decompress = (data: ArrayBuffer) => Pako.inflate(data);
