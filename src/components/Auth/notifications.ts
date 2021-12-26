import { notification } from 'antd';

const duration = 6;

const baseOptions = {
  duration,
};

const emailNotVerified = () => notification.success({
  message: 'Check your email',
  description: 'Your email address has to be verified before you can upload files!',
  ...baseOptions,
});

const signUpSuccessful = () => notification.success({
  message: 'Sign Up successful',
  description: 'Welcome on board!',
  ...baseOptions,
});

const logInSuccessful = () => notification.success({
  message: 'Login successful',
  description: 'Welcome back!',
  ...baseOptions,
});

const logInFailed = (err: Error) => notification.error({
  message: 'Failed to create an account',
  description: err.message,
});

const restrictedPage = () => notification.error({
  message: 'Restricted page',
  description: 'You have to be logged in to access this page!',
  ...baseOptions,
});

const logOutSuccessful = () => notification.warning({
  message: 'Logout successful',
  description: 'See you again!',
  ...baseOptions,
});

const logOutFailed = (err: Error) => notification.error({
  message: 'Login failed',
  description: err.message,
});

export {
  emailNotVerified,
  signUpSuccessful,
  logInSuccessful,
  logInFailed,
  restrictedPage,
  logOutSuccessful,
  logOutFailed,
};
