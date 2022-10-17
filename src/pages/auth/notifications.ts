import { notification } from 'antd';

const duration = 6;

const baseOptions = {
  duration,
  placement: 'bottomRight' as const,
};

const emailNotVerified = () => notification.warning({
  message: 'Check your email',
  description: 'Your email address has to be verified before you can upload files!',
  ...baseOptions,
});

const usernameNotSet = () => notification.warning({
  message: 'Update your profile',
  description: 'Your username has to be set before you can upload files!',
  ...baseOptions,
});

const signUpSuccessful = () => notification.success({
  message: 'Sign Up successful',
  description: 'Welcome on board!',
  ...baseOptions,
});

const signUpFailed = (err: Error) => notification.error({
  message: 'Failed to create an account',
  description: err.message,
  ...baseOptions,
});

const logInSuccessful = () => notification.success({
  message: 'Log in successful',
  description: 'Welcome back!',
  ...baseOptions,
});

const logInFailed = (err: Error) => notification.error({
  message: 'Failed to log in',
  description: err.message,
  ...baseOptions,
});

const restrictedPage = () => notification.error({
  message: 'Restricted page',
  description: 'You have to be logged in to access this page!',
  ...baseOptions,
});

const logOutSuccessful = () => notification.success({
  message: 'Log out successful',
  description: 'See you next time!',
  ...baseOptions,
});

const resetSuccessful = () => notification.success({
  message: 'Password reset initiated',
  description: 'Check your email!',
  ...baseOptions,
});

const resetFailed = (err: Error) => notification.error({
  message: 'Password reset failed',
  description: err.message,
  ...baseOptions,
});

const sendingEmailVerificationFailed = (err: Error) => notification.success({
  message: 'Sending verification email failed',
  description: err.message,
  ...baseOptions,
});

const emailVerificationSent = () => notification.success({
  message: 'Check your email',
  description: 'Email verification sent!',
  ...baseOptions,
});

const emailVerificationFailed = (err: Error) => notification.error({
  message: 'Email verification failed',
  description: err.message,
  ...baseOptions,
});

const emailVerificationSuccess = () => notification.success({
  message: 'Email verified',
  description: 'Your email has been verified!',
  ...baseOptions,
});

const profileUpdateSuccess = () => notification.success({
  message: 'Profile updated',
  description: 'Your profile has been updated!',
  ...baseOptions,
});

const profileUpdateFailed = (err: Error) => notification.error({
  message: 'Unable to update your profile',
  description: err.message,
  ...baseOptions,
});

const passwordUpdateSuccess = () => notification.success({
  message: 'Password changed',
  description: 'Your password has been changed!',
  ...baseOptions,
});

const passwordUpdateFailed = (err: Error) => notification.error({
  message: 'Unable to change your password',
  description: err.message,
  ...baseOptions,
});

const databaseGenericError = (err: Error) => notification.error({
  message: 'Database Error',
  description: err.message,
  ...baseOptions,
});

const copiedToClipboard = () => notification.success({
  message: 'Copied to clipboard',
  ...baseOptions,
});

export {
  emailNotVerified,
  usernameNotSet,
  signUpSuccessful,
  signUpFailed,
  logInSuccessful,
  logInFailed,
  restrictedPage,
  logOutSuccessful,
  resetSuccessful,
  resetFailed,
  sendingEmailVerificationFailed,
  emailVerificationSent,
  emailVerificationFailed,
  emailVerificationSuccess,
  profileUpdateSuccess,
  profileUpdateFailed,
  passwordUpdateSuccess,
  passwordUpdateFailed,
  databaseGenericError,
  copiedToClipboard,
};
