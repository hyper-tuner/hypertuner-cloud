/* eslint-disable no-bitwise */

import { Parser } from 'mlg-converter';
import { Result } from 'mlg-converter/dist/types';
import Pako from 'pako';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export interface WorkerOutput {
  type: 'progress' | 'metrics' | 'result' | 'error' ;
  progress?: number;
  result?: Result;
  error?: Error;
  elapsed?: number;
  records?: number;
}

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  try {
    const t0 = performance.now();
    const result = new Parser(Pako.inflate(new Uint8Array(data)).buffer).parse((progress) => {
      ctx.postMessage({
        type: 'progress',
        progress,
        elapsed: ~~(performance.now() - t0),
      } as WorkerOutput);
    });
    ctx.postMessage({
      type: 'metrics',
      elapsed: ~~(performance.now() - t0),
      records: result.records.length,
    } as WorkerOutput);
    ctx.postMessage({ type: 'result', result } as WorkerOutput);
  } catch (error) {
    ctx.postMessage({ type: 'error', error } as WorkerOutput);
    throw error;
  }
});
