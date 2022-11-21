import { ConstantTypes, ScalarConstant } from '@hyper-tuner/types';

export const divider: ScalarConstant = {
  type: ConstantTypes.SCALAR,
  size: 'U08',
  offset: 25,
  units: '',
  scale: 1,
  transform: 0,
  min: 1,
  max: 8,
  digits: 0,
};
