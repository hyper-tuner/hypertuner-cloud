export const isMac = `${window.navigator.platform}`.includes('Mac');
export const environment = import.meta.env.NODE_ENV || 'development';
export const isProduction = environment === 'production';
export const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
export const platform = `${window.navigator.platform}`;
