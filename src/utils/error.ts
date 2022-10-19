// eslint-disable-next-line import/prefer-default-export
export const isAbortedRequest = (error: Error): boolean => error.message === 'The user aborted a request.';
