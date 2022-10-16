import { fetchEnv } from './env';

// eslint-disable-next-line import/prefer-default-export
export const buildFullUrl = (parts = [] as string[]) => `${fetchEnv('VITE_WEB_URL')}/#${parts.join('/')}`;
