import { Parser } from 'mlg-converter';

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
  ctx.postMessage({
    type: 'metrics',
    metrics: {
      elapsedMs: Math.round(performance.now() - t0),
    },
  });
  ctx.postMessage({ type: 'result', result });
});
