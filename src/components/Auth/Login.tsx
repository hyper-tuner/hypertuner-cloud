import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Divider,
  notification,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';

const { Item } = Form;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async ({ email, password }: { email: string, password: string }) => {
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.warn(err);
      notification.error({
        message: 'Failed to create an account',
        description: (err as Error).message,
      });
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 350,
      margin: '0 auto',
    }}>
      <Divider>Login</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        validateMessages={validateMessages}
        autoComplete="off"
      >
        <Item
          name="email"
          rules={[{ required: true, type: 'email' }]}
          hasFeedback
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
          />
        </Item>
        <Item
          name="password"
          rules={[{ required: true }]}
          hasFeedback
        >
          <Input.Password
            placeholder="Password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isLoading}
          >
            Log in
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>Sign Up now!</Link>
        <Link to="/" style={{ float: 'right' }}>
          Forgot password?
        </Link>
      </Form>
    </div>
  );
};

export default Login;
