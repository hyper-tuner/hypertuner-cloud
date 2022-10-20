import { Parser } from 'mlg-converter';
import { Result } from 'mlg-converter/dist/types';
import Pako from 'pako';
import LogValidator from '../utils/logs/LogValidator';
import MslLogParser from '../utils/logs/MslLogParser';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export interface WorkerOutput {
  type: 'progress' | 'metrics' | 'result' | 'error';
  progress?: number;
  result?: Result;
  error?: Error;
  elapsed?: number;
  records?: number;
}

// eslint-disable-next-line no-bitwise
const elapsed = (t0: number): number => ~~(performance.now() - t0);

const parseMsl = (raw: ArrayBufferLike, t0: number): Result => new MslLogParser(raw).parse().getResult();

const parseMlg = (raw: ArrayBufferLike, t0: number): Result => new Parser(raw).parse((progress) => {
  ctx.postMessage({
    type: 'progress',
    progress,
    elapsed: elapsed(t0),
  } as WorkerOutput);
});

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  try {
    const t0 = performance.now();
    const raw = Pako.inflate(new Uint8Array(data)).buffer;
    const logParser = new LogValidator(raw);

    if (logParser.isMLG()) {
      const mlgResult = parseMlg(raw, t0);
      ctx.postMessage({
        type: 'metrics',
        elapsed: elapsed(t0),
        records: mlgResult.records.length,
      } as WorkerOutput);
      ctx.postMessage({ type: 'result', result: mlgResult } as WorkerOutput);

      return;
    }

    if (logParser.isMSL()) {
      const mslResult = parseMsl(raw, t0);
      ctx.postMessage({
        type: 'metrics',
        elapsed: elapsed(t0),
        records: mslResult.records.length,
      } as WorkerOutput);
      ctx.postMessage({ type: 'result', result: mslResult } as WorkerOutput);

      return;
    }

    throw new Error('Unsupported file format');
  } catch (error) {
    ctx.postMessage({ type: 'error', error } as WorkerOutput);
    throw error;
  }
});
