import {
  FormatError,
  Parser,
} from 'mlg-converter';
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

// eslint-disable-next-line no-bitwise
const elapsed = (t0: number): number => ~~(performance.now() - t0);

const parseMsl = (raw: ArrayBufferLike, t0: number): Result | null => {
  try {
    // return new Parser(raw).parse((progress) => {
    //   ctx.postMessage({
    //     type: 'progress',
    //     progress,
    //     elapsed: elapsed(t0),
    //   } as WorkerOutput);
    // });
    return {
      fileFormat: 'MSL',
      formatVersion: 1,
      timestamp: new Date(),
      info: '',
      bitFieldNames: '',
      records: [],
      fields: [],
    };
  } catch (error) {
    ctx.postMessage({ type: 'error', error } as WorkerOutput);
    throw error;
  }
};

const parseMlg = (raw: ArrayBufferLike, t0: number): Result | null => {
  try {
    return new Parser(raw).parse((progress) => {
      ctx.postMessage({
        type: 'progress',
        progress,
        elapsed: elapsed(t0),
      } as WorkerOutput);
    });
  } catch (error) {
    if ((error as FormatError).name === 'FormatError') {
      return null;
    }

    ctx.postMessage({ type: 'error', error } as WorkerOutput);
    throw error;
  }
};

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  try {
    const t0 = performance.now();
    const raw = Pako.inflate(new Uint8Array(data)).buffer;

    // first try MLG
    const mlgResult = parseMlg(raw, t0);

    if (mlgResult) {
      ctx.postMessage({
        type: 'metrics',
        elapsed: elapsed(t0),
        records: mlgResult.records.length,
      } as WorkerOutput);
      ctx.postMessage({ type: 'result', result: mlgResult } as WorkerOutput);
    } else {
      // try MSL
      const mslResult = parseMsl(raw, t0);

      if (mslResult) {
        ctx.postMessage({
          type: 'metrics',
          elapsed: elapsed(t0),
          records: mslResult.records.length,
        } as WorkerOutput);
        ctx.postMessage({ type: 'result', result: mslResult } as WorkerOutput);
      } else {
        const error = new Error('Unknown file format');
        ctx.postMessage({ type: 'error', error } as WorkerOutput);
        throw error;
      }
    }
  } catch (error) {
    ctx.postMessage({ type: 'error', error } as WorkerOutput);
    throw error;
  }
});
