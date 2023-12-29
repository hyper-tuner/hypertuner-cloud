import { Help as HelpType } from '@hyper-tuner/types';

const help: HelpType = {
  reqFuel:
    'The base reference pulse width required to achieve stoichiometric at 100% VE and a manifold absolute pressure (MAP) of 100kPa using current settings.',
  algorithm: 'Fueling calculation algorithm',
  injType:
    'Port Injection (one injector for each cylinder) or Throttle Body (injectors shared by cylinders)',
};

export default help;
