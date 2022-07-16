import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Divider,
} from 'antd';
import { MailOutlined } from '@ant-design/icons';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';
import {
  resetFailed,
  resetSuccessful,
} from './notifications';

const { Item } = Form;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { initResetPassword } = useAuth();
  const navigate = useNavigate();

  const onFinish = async ({ email }: { form: any, email: string }) => {
    setIsLoading(true);
    try {
      await initResetPassword(email);
      resetSuccessful();
      navigate(Routes.LOGIN);
    } catch (error) {
      form.resetFields();
      console.warn(error);
      resetFailed(error as Error);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Divider>Reset password</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        validateMessages={validateMessages}
        form={form}
      >
        <Item
          name="email"
          rules={[{ required: true, type: 'email' }]}
          hasFeedback
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            autoComplete="email"
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isLoading}
          >
            Reset password
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>Sign Up</Link>
        <Link to={Routes.LOGIN} style={{ float: 'right' }}>
          Log In
        </Link>
      </Form>
    </div>
  );
};

export default ResetPassword;
