// eslint-disable-next-line import/prefer-default-export
export enum Routes {
  ROOT = '/',
  HUB = '/',

  TUNE_ROOT = '/t/:tuneId',
  TUNE_TAB = '/t/:tuneId/:tab',
  TUNE_TUNE = '/t/:tuneId/tune',
  TUNE_DIALOG = '/t/:tuneId/tune/:category/:dialog',
  TUNE_LOGS = '/t/:tuneId/logs',
  TUNE_DIAGNOSE = '/t/:tuneId/diagnose',

  UPLOAD = '/upload',

  LOGIN = '/auth/login',
  LOGOUT = '/auth/logout',
  PROFILE = '/auth/profile',
  SIGN_UP = '/auth/sign-up',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  MAGIC_LINK_CONFIRMATION = '/auth/magic-link-confirmation',
}
