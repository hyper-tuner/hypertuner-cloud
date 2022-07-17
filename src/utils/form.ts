import { Rule } from 'antd/lib/form';

const REQUIRED_MESSAGE = 'This field is required';

// eslint-disable-next-line import/prefer-default-export
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

export const passwordRules: Rule[] = [
  { required: true },
  { pattern: passwordPattern, message: 'Password is too weak!' },
];

export const emailRules: Rule[] = [{
  required: true,
  type: 'email',
  whitespace: true,
}];

export const requiredTextRules: Rule[] = [{
  required: true,
  message: REQUIRED_MESSAGE,
  whitespace: true,
}];

export const requiredRules: Rule[] = [{
  required: true,
  message: REQUIRED_MESSAGE,
}];
