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
import {
  Link,
  useHistory,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';
import emailNotVerifiedWarning from './emailNotVerifiedWarning';

const { Item } = Form;

const Login = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const onFinish = async ({ email, password }: { form: any, email: string, password: string }) => {
    setIsLoading(true);
    try {
      const userCredentials = await login(email, password);
      notification.success({
        message: 'Login successful',
        description: 'Welcome back!',
      });

      if (!userCredentials.user.emailVerified) {
        emailNotVerifiedWarning();
      }

      history.push(Routes.ROOT);
    } catch (err) {
      form.resetFields();
      console.warn(err);
      notification.error({
        message: 'Login failed',
        description: (err as Error).message,
      });
      setIsLoading(false);
    }
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
