// eslint-disable-next-line import/prefer-default-export
export const buildFullUrl = (parts = [] as string[]) => `${import.meta.env.VITE_WEB_URL}/#${parts.join('/')}`;

