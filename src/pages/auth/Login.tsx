import {
  useCallback,
  useEffect,
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
} from './notifications';
import {
  emailRules,
  requiredRules,
} from '../../utils/form';

const { Item } = Form;

const Login = () => {
  const [formMagicLink] = Form.useForm();
  const [formEmail] = Form.useForm();

  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [googleCodes, setGoogleCodes] = useState<[string, string]>(['', '']);

  const { login, googleAuth, githubAuth, facebookAuth, listAuthMethods } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isGoogleLoading || isGithubLoading || isFacebookLoading;
  const redirectAfterLogin = useCallback(() => navigate(Routes.HUB), [navigate]);

  const googleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await googleAuth(...googleCodes);
    } catch (error) {
      logInFailed(error as Error);
    }
  }, [googleAuth, googleCodes]);

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
      if (!user.verified) {
        emailNotVerified();
      }
      // if (!user.name) {
      //   navigate(Routes.PROFILE);
      // }
      redirectAfterLogin();
    } catch (error) {
      console.warn(error);
      logInFailed(error as Error);
      formMagicLink.resetFields();
      formEmail.resetFields();
      setIsEmailLoading(false);
    }
  };

  useEffect(() => {
    listAuthMethods().then((methods) => {
      console.log(methods);

      const { authProviders } = methods;

      authProviders.forEach((provider) => {
        switch (provider.name) {
          case 'google':
            setGoogleCodes([provider.codeChallenge, provider.codeVerifier]);
            break;
          default:
            break;
        }
      });
    });
  }, [listAuthMethods]);

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
      <Form
        onFinish={emailLogin}
        validateMessages={validateMessages}
        form={formEmail}
      >
        <Divider />
        <Item name="email" rules={emailRules} hasFeedback>
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            autoComplete="email"
            disabled={isAnythingLoading}
          />
        </Item>
        <Item
          name="password"
          rules={requiredRules}
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
