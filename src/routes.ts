// eslint-disable-next-line import/prefer-default-export
export enum Routes {
  ROOT = '/',

  TUNE_ROOT = '/t/:tuneId',
  TUNE_TAB = '/t/:tuneId/:tab',
  TUNE_TUNE = '/t/:tuneId/tune',
  TUNE_DIALOG = '/t/:tuneId/tune/:category/:dialog',
  TUNE_LOG = '/t/:tuneId/log',
  TUNE_DIAGNOSE = '/t/:tuneId/diagnose',

  LOGIN = '/auth/login',
  LOGOUT = '/auth/logout',
  SIGN_UP = '/auth/sign-up',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  UPLOAD = '/upload',
}
