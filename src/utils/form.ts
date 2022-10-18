import { Rule } from 'antd/lib/form';

const REQUIRED_MESSAGE = 'This field is required';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

const usernamePattern = /^[A-Za-z0-9][\w\\-]{3,30}$/;

export const passwordRules: Rule[] = [
  { required: true },
  { pattern: passwordPattern, message: 'Password is too weak!' },
];

export const usernameRules: Rule[] = [
  { required: true },
  { pattern: usernamePattern, message: 'Username has invalid format!' },
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
