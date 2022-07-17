import { fetchEnv } from './env';

export const buildFullUrl = (parts = [] as string[]) => `${fetchEnv('VITE_WEB_URL')}/#${parts.join('/')}`;

export const buildRedirectUrl = (page: string) => `${fetchEnv('VITE_WEB_URL')}?redirectPage=${page}`;

