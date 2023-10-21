export enum Routes {
  HUB = '/',

  TUNE_ROOT = '/t/:tuneId',
  TUNE_TAB = '/t/:tuneId/:tab',
  TUNE_TUNE = '/t/:tuneId/tune',
  TUNE_DIALOG = '/t/:tuneId/tune/:category/:dialog',
  TUNE_GROUP_MENU_DIALOG = '/t/:tuneId/tune/:category/:groupMenu/:dialog',
  TUNE_LOGS = '/t/:tuneId/logs',
  TUNE_LOGS_FILE = '/t/:tuneId/logs/:fileName',
  TUNE_DIAGNOSE = '/t/:tuneId/diagnose',
  TUNE_DIAGNOSE_FILE = '/t/:tuneId/diagnose/:fileName',

  UPLOAD = '/upload',
  UPLOAD_WITH_TUNE_ID = '/upload/:tuneId',

  LOGIN = '/auth/login',
  LOGOUT = '/auth/logout',
  PROFILE = '/auth/profile',
  SIGN_UP = '/auth/sign-up',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  RESET_PASSWORD_CONFIRMATION = '/auth/reset-password-confirmation/:token',
  EMAIL_VERIFICATION = '/auth/email-verification/:token',
  OAUTH_CALLBACK = '/auth/oauth-callback/:provider',

  ABOUT = '/about',
  USER_ROOT = '/user/:userId',

  REDIRECT_PAGE_OAUTH_CALLBACK = 'oauth',
}
