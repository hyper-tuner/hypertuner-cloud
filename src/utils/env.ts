export const isMac = `${window.navigator.platform}`.includes('Mac');
export const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
export const isProduction = environment === 'production';
export const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
export const platform = `${window.navigator.platform}`;

export const fetchEnv = (envName: string): string => {
  const envValue = import.meta.env[envName];
  if (envValue === '' || envValue === null || envValue === undefined) {
    throw new Error(`Missing ENV: ${envName}`);
  }

  return envValue;
};
