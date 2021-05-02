export const isWeb = process.env.APP_PLATFORM === 'web';
export const isDesktop = process.env.APP_PLATFORM === 'desktop';
export const isMac = `${window.navigator.platform}`.includes('Mac');
export const environment = process.env.NODE_ENV || 'development';
export const isProduction = environment === 'production';
export const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
export const platform = `${window.navigator.platform}`;
