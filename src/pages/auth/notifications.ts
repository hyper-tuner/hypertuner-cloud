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

const magicLinkSent = () => notification.success({
  message: 'Check your email',
  description: 'Magic link sent!',
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
});

const logInSuccessful = () => notification.success({
  message: 'Log in successful',
  description: 'Welcome back!',
  ...baseOptions,
});

const logInFailed = (err: Error) => notification.error({
  message: 'Failed to log in',
  description: err.message,
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

const logOutFailed = (err: Error) => notification.error({
  message: 'Log out failed',
  description: err.message,
});

const resetSuccessful = () => notification.success({
  message: 'Password reset initiated',
  description: 'Check your email!',
  ...baseOptions,
});

const resetFailed = (err: Error) => notification.error({
  message: 'Password reset failed',
  description: err.message,
});

const magicLinkConfirmationFailed = (err: Error) => notification.error({
  message: 'Magic Link is invalid',
  description: err.message,
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
});

const profileUpdateSuccess = () => notification.success({
  message: 'Updated',
  description: 'Your profile has been updated!',
  ...baseOptions,
});

const profileUpdateFailed = (err: Error) => notification.error({
  message: 'Unable to update your profile',
  description: err.message,
});

export {
  emailNotVerified,
  magicLinkSent,
  signUpSuccessful,
  signUpFailed,
  logInSuccessful,
  logInFailed,
  restrictedPage,
  logOutSuccessful,
  logOutFailed,
  resetSuccessful,
  resetFailed,
  magicLinkConfirmationFailed,
  sendingEmailVerificationFailed,
  emailVerificationSent,
  emailVerificationFailed,
  profileUpdateSuccess,
  profileUpdateFailed,
};
