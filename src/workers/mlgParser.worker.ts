import { Parser } from 'mlg-converter';
import { formatBytes } from '../utils/number';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data }: { data: ArrayBuffer }) => {
  const t0 = performance.now();

  const result = new Parser(data).parse((progress) => {
    ctx.postMessage({
      type: 'progress',
      progress,
    });
  });

  const t1 = performance.now();

  ctx.postMessage({ type: 'result', result });
  ctx.postMessage({
    type: 'metrics',
    metrics: {
      elapsedMs: Math.round(t1 - t0),
      rawSize: formatBytes(data.byteLength),
    },
  });
});
