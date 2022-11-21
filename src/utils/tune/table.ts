import { round } from '../numbers';

export const parseXy = (value: string) =>
  value
    .trim()
    .split('\n')
    .map((val) => val.trim())
    .filter((val) => val !== '')
    .map((val) => round(Number(val), 2));

export const parseZ = (value: string) =>
  value
    .trim()
    .split('\n')
    .map((val) => val.trim().split(' ').map(Number))
    .reverse();
