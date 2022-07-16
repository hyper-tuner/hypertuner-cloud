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
  UnlockOutlined,
  GoogleOutlined,
  GithubOutlined,
  FacebookOutlined,
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
  magicLinkSent,
} from './notifications';

const { Item } = Form;

const Login = () => {
  const [formMagicLink] = Form.useForm();
  const [formEmail] = Form.useForm();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const { login, googleAuth, githubAuth, facebookAuth, sendMagicLink } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isGoogleLoading || isGithubLoading || isFacebookLoading || isMagicLinkLoading;
  const redirectAfterLogin = useCallback(() => navigate(Routes.HUB), [navigate]);

  const googleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await googleAuth();
    } catch (error) {
      logInFailed(error as Error);
    }
  }, [googleAuth]);

  const githubLogin = useCallback(async () => {
    setIsGithubLoading(true);
    try {
      await githubAuth();
    } catch (error) {
      logInFailed(error as Error);
    }
  }, [githubAuth]);

  const facebookLogin = async () => {
    setIsFacebookLoading(true);
    try {
      await facebookAuth();
    } catch (error) {
      logInFailed(error as Error);
    }
  };

  const emailLogin = async ({ email, password }: { email: string, password: string }) => {
    setIsEmailLoading(true);
    try {
      const user = await login(email, password);
      logInSuccessful();
      if (!user.emailVerification) {
        emailNotVerified();
      }
      if (!user.name) {
        navigate(Routes.PROFILE);
      }
      redirectAfterLogin();
    } catch (error) {
      console.warn(error);
      logInFailed(error as Error);
      formMagicLink.resetFields();
      formEmail.resetFields();
      setIsEmailLoading(false);
    }
  };

  const magicLinkLogin = async ({ email }: { email: string }) => {
    setIsMagicLinkLoading(true);
    try {
      await sendMagicLink(email);
      magicLinkSent();
    } catch (error) {
      logInFailed(error as Error);
    } finally {
      setIsMagicLinkLoading(false);
      formMagicLink.resetFields();
      formEmail.resetFields();
    }
  };

  return (
    <div className="auth-container">
      <Divider>Log In</Divider>
      <Space direction="horizontal" style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          loading={isGoogleLoading}
          onClick={googleLogin}
          disabled={isAnythingLoading}
        >
          <GoogleOutlined />Google
        </Button>
        <Button
          loading={isGithubLoading}
          onClick={githubLogin}
          disabled={isAnythingLoading}
        >
          <GithubOutlined />GitHub
        </Button>
        <Button
          loading={isFacebookLoading}
          onClick={facebookLogin}
          disabled={isAnythingLoading}
        >
          <FacebookOutlined />Facebook
        </Button>
      </Space>
      <Divider />
      <Form
        onFinish={magicLinkLogin}
        validateMessages={validateMessages}
        form={formMagicLink}
      >
        <Item name="email" rules={[{ required: true, type: 'email' }]} hasFeedback>
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            id="email-magic-link"
            autoComplete="email"
            disabled={isAnythingLoading}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isMagicLinkLoading}
            disabled={isAnythingLoading}
            icon={<MailOutlined />}
          >
            Send me a Magic Link
          </Button>
        </Item>
      </Form>
      <Form
        onFinish={emailLogin}
        validateMessages={validateMessages}
        form={formEmail}
      >
        <Divider />
        <Item name="email" rules={[{ required: true, type: 'email' }]} hasFeedback>
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            autoComplete="email"
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
            autoComplete="current-password"
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
            icon={<UnlockOutlined />}
          >
            Log in using password
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>
          Sign Up
        </Link>
        <Link to={Routes.RESET_PASSWORD} style={{ float: 'right' }}>
          Forgot password?
        </Link>
      </Form>
    </div>
  );
};

export default Login;
