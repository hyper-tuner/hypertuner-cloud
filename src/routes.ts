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
  UPLOAD_WITH_TUNE_ID = '/upload/:tuneId',

  LOGIN = '/auth/login',
  LOGOUT = '/auth/logout',
  PROFILE = '/auth/profile',
  SIGN_UP = '/auth/sign-up',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  MAGIC_LINK_CONFIRMATION = '/auth/magic-link-confirmation',
  EMAIL_VERIFICATION = '/auth/email-verification',
  RESET_PASSWORD_CONFIRMATION = '/auth/reset-password-confirmation',

  REDIRECT_PAGE_MAGIC_LINK_CONFIRMATION = 'magic-link-confirmation',
  REDIRECT_PAGE_EMAIL_VERIFICATION = 'email-verification',
  REDIRECT_PAGE_RESET_PASSWORD = 'reset-password',
}
