/* eslint-disable no-bitwise */

import { Parser } from 'mlg-converter';
import pako from 'pako';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  try {
    const t0 = performance.now();
    const buff = pako.inflate(new Uint8Array(data)).buffer;
    const result = new Parser(buff).parse((progress) => {
      ctx.postMessage({
        type: 'progress',
        progress,
        elapsed: ~~(performance.now() - t0),
      });
    });
    ctx.postMessage({
      type: 'metrics',
      elapsed: ~~(performance.now() - t0),
      records: result.records.length,
    });
    ctx.postMessage({ type: 'result', result });
  } catch (error) {
    ctx.postMessage({ type: 'error', error });
    throw error;
  }
});
