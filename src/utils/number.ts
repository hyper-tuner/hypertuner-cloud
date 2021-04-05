export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k**i).toFixed(dm))  } ${  sizes[i]}`;
};

export const leftPad = (n: number, z = 2) => (`00${n}`).slice(-z);

export const msToTime = (input: number) => {
  let s = input;
  const ms = s % 1000;
  s = (s - ms) / 1000;
  const secs = s % 60;
  s = (s - secs) / 60;
  const mins = s % 60;
  const hrs = (s - mins) / 60;

  return `${leftPad(hrs)}:${leftPad(mins)}:${leftPad(secs)}.${ms}`;
};
