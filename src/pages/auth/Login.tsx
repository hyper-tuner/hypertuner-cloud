import {
  useCallback,
  useState,
} from 'react';
import {
  Form,
  Input,
  Button,
  Divider,
  Space,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';
import {
  emailNotVerified,
  logInFailed,
  logInSuccessful,
} from './notifications';
import { containerStyle } from './common';

const { Item } = Form;

const Login = () => {
  const [form] = Form.useForm();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const { login, googleAuth, githubAuth } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isGoogleLoading || isGithubLoading;
  const redirectAfterLogin = useCallback(() => navigate(Routes.HUB), [navigate]);

  const googleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await googleAuth();
      logInSuccessful();
      redirectAfterLogin();
    } catch (error) {
      logInFailed(error as Error);
      setIsGoogleLoading(false);
    }
  }, [googleAuth, redirectAfterLogin]);

  const githubLogin = useCallback(async () => {
    setIsGithubLoading(true);
    try {
      await githubAuth();
      logInSuccessful();
      redirectAfterLogin();
    } catch (error) {
      logInFailed(error as Error);
      setIsGithubLoading(false);
    }
  }, [githubAuth, redirectAfterLogin]);

  const emailLogin = async ({ email, password }: { form: any, email: string, password: string }) => {
    setIsEmailLoading(true);
    try {
      const userCredentials = await login(email, password);
      logInSuccessful();

      if (!userCredentials.user.emailVerified) {
        emailNotVerified();
      }

      redirectAfterLogin();
    } catch (error) {
      form.resetFields();
      console.warn(error);
      logInFailed(error as Error);
      setIsEmailLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Divider>Log In using email</Divider>
      <Form
        onFinish={emailLogin}
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
            disabled={isAnythingLoading}
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
            disabled={isAnythingLoading}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isEmailLoading}
            disabled={isAnythingLoading}
          >
            Log In
          </Button>
        </Item>
      </Form>
      <Space direction="horizontal" style={{ width: '100%', justifyContent: 'center' }}>
        <Item>
          <Button
            loading={isGoogleLoading}
            onClick={googleLogin}
            disabled={isAnythingLoading}
          >
            <GoogleOutlined />Google
          </Button>
        </Item>
        <Item>
          <Button
            loading={isGithubLoading}
            onClick={githubLogin}
            disabled={isAnythingLoading}
          >
            <GithubOutlined />GitHub
          </Button>
        </Item>
      </Space>
      <Button type="link">
        <Link to={Routes.SIGN_UP}>Sign Up</Link>
      </Button>
      <Button type="link" style={{ float: 'right' }}>
        <Link to={Routes.RESET_PASSWORD}>
          Forgot password?
        </Link>
      </Button>
    </div>
  );
};

export default Login;
