/* eslint-disable no-bitwise */
import { Parser } from 'mlg-converter';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  const t0 = performance.now();

  const result = new Parser(data).parse((progress) => {
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
});
