import { Parser } from 'mlg-converter';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data }) => {
  ctx.postMessage(new Parser(data).parse());
});
