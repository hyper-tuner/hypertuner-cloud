import { notification } from 'antd';

const emailNotVerifiedWarning = () => notification.warn({
  message: 'Check your email',
  description: 'Your email address has to be verified before you can upload files!',
});

export default emailNotVerifiedWarning;
