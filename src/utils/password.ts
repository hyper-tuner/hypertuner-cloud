// eslint-disable-next-line import/prefer-default-export
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

export const passwordRules = [
  { required: true },
  { pattern: passwordPattern, message: 'Password is too weak!' },
];
