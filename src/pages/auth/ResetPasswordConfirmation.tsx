import {
  Button,
  Divider,
  Form,
  Input,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import {
  passwordUpdateFailed,
  passwordUpdateSuccess,
} from './notifications';
import { passwordRules } from '../../utils/password';
import validateMessages from './validateMessages';

const { Item } = Form;

const ResetPasswordConfirmation = () => {
  const { confirmResetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const changePassword = async ({ password }: { password: string }) => {
    setIsLoading(true);
    try {
      await confirmResetPassword(userId!, secret!, password);
      passwordUpdateSuccess();
      navigate(Routes.LOGIN);
    } catch (error) {
      console.warn(error);
      passwordUpdateFailed(error as Error);
      form.resetFields();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !secret) {
      passwordUpdateFailed(new Error('Invalid URL'));
      navigate(Routes.HUB);
    }
  }, [navigate, secret, userId]);

  return (
    <div className="auth-container">
      <Divider>Change password</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={changePassword}
        validateMessages={validateMessages}
        autoComplete="off"
        form={form}
      >
        <Item
          name="password"
          rules={passwordRules}
          hasFeedback
        >
          <Input.Password
            placeholder="New password"
            autoComplete="new-password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            icon={<LockOutlined />}
            loading={isLoading}
          >
            Change
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>Sign Up</Link>
        <Link to={Routes.RESET_PASSWORD} style={{ float: 'right' }}>
          Forgot password?
        </Link>
      </Form>
    </div>
  );
};

export default ResetPasswordConfirmation;
