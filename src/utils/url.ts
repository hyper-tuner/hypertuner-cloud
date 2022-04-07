export const buildFullUrl = (parts = [] as string[]) => `${import.meta.env.VITE_WEB_URL}/#${parts.join('/')}`;

export const buildRedirectUrl = (page: string) => `${import.meta.env.VITE_WEB_URL}?redirectPage=${page}`;

