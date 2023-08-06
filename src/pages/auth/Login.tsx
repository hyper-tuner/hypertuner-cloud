import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Space } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UnlockOutlined,
  GoogleOutlined,
  GithubOutlined,
  FacebookOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { OAuthProviders, useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';
import {
  emailNotVerified,
  logInFailed,
  logInSuccessful,
  signUpFailed,
  signUpSuccessful,
} from './notifications';
import { emailRules, requiredRules, usernameRules } from '../../utils/form';
import { buildRedirectUrl } from '../../utils/url';

const { Item } = Form;

export enum FormRoles {
  LOGIN = 'Login',
  SING_UP = 'Sign Up',
}

const Login = ({ formRole }: { formRole: FormRoles }) => {
  const [formEmail] = Form.useForm();
  const isLogin = formRole === FormRoles.LOGIN;
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [providersReady, setProvidersReady] = useState(false);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [facebookUrl, setFacebookUrl] = useState<string | null>(null);
  const [providersStatuses, setProvidersStatuses] = useState<{
    [key: string]: boolean;
  }>({
    google: false,
    github: false,
    facebook: false,
  });

  const { login, signUp, listAuthMethods } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isOAuthLoading;
  const redirectAfterLogin = useCallback(() => navigate(Routes.HUB), [navigate]);
  const isOauthEnabled = Object.values(providersStatuses).includes(true);

  const emailLogin = async ({ email, password }: { email: string; password: string }) => {
    setIsEmailLoading(true);
    try {
      const user = await login(email, password);
      logInSuccessful();

      if (!user.verified) {
        emailNotVerified();
      }

      redirectAfterLogin();
    } catch (error) {
      logInFailed(error as Error);
      formEmail.resetFields();
      setIsEmailLoading(false);
    }
  };

  const emailSignUp = async ({
    email,
    password,
    username,
  }: { email: string; password: string; username: string }) => {
    setIsEmailLoading(true);
    try {
      const user = await signUp(email, password, username);
      signUpSuccessful();

      if (!user.verified) {
        emailNotVerified();
      }

      navigate(Routes.HUB);
    } catch (error) {
      signUpFailed(error as Error);
      formEmail.resetFields();
      setIsEmailLoading(false);
    }
  };

  const oauthMethods: {
    [provider: string]: { label: string; icon: ReactNode; onClick: () => void };
  } = {
    google: {
      label: 'Google',
      icon: <GoogleOutlined />,
      onClick: () => {
        setIsOAuthLoading(true);
        window.location.href = googleUrl!;
      },
    },
    github: {
      label: 'GitHub',
      icon: <GithubOutlined />,
      onClick: () => {
        setIsOAuthLoading(true);
        window.location.href = githubUrl!;
      },
    },
    facebook: {
      label: 'Facebook',
      icon: <FacebookOutlined />,
      onClick: () => {
        setIsOAuthLoading(true);
        window.location.href = facebookUrl!;
      },
    },
  };

  useEffect(() => {
    listAuthMethods().then((methods) => {
      const { authProviders } = methods;
      window.localStorage.setItem('authProviders', JSON.stringify(authProviders));

      authProviders.forEach((provider) => {
        if (provider.name) {
          setProvidersReady(true);
        }

        switch (provider.name) {
          case OAuthProviders.GOOGLE: {
            setProvidersStatuses((prevState) => ({
              ...prevState,
              [provider.name]: true,
            }));
            setGoogleUrl(
              `${provider.authUrl}${encodeURIComponent(
                buildRedirectUrl(Routes.REDIRECT_PAGE_OAUTH_CALLBACK, {
                  provider: provider.name,
                }),
              )}`,
            );
            break;
          }
          case OAuthProviders.GITHUB: {
            setProvidersStatuses((prevState) => ({
              ...prevState,
              [provider.name]: true,
            }));
            setGithubUrl(
              `${provider.authUrl}${encodeURIComponent(
                buildRedirectUrl(Routes.REDIRECT_PAGE_OAUTH_CALLBACK, {
                  provider: provider.name,
                }),
              )}`,
            );
            break;
          }
          case OAuthProviders.FACEBOOK: {
            setProvidersStatuses((prevState) => ({
              ...prevState,
              [provider.name]: true,
            }));
            setFacebookUrl(
              `${provider.authUrl}${encodeURIComponent(
                buildRedirectUrl(Routes.REDIRECT_PAGE_OAUTH_CALLBACK, {
                  provider: provider.name,
                }),
              )}`,
            );
            break;
          }
          default:
            throw new Error(`Unsupported provider: ${provider.name}`);
        }
      });
    });
  }, [listAuthMethods]);

  const OauthSection = () => {
    return isOauthEnabled ? (
      <>
        <Space direction='horizontal' style={{ width: '100%', justifyContent: 'center' }}>
          {providersReady &&
            Object.keys(oauthMethods).map(
              (provider) =>
                providersStatuses[provider] && (
                  <Button
                    key={provider}
                    icon={oauthMethods[provider].icon}
                    onClick={oauthMethods[provider].onClick}
                    loading={isOAuthLoading}
                  >
                    {oauthMethods[provider].label}
                  </Button>
                ),
            )}
        </Space>
        <Divider />
      </>
    ) : null;
  };

  const bottomLinksLogin = (
    <>
      <Link to={Routes.SIGN_UP}>Sign Up</Link>
      <Link to={Routes.RESET_PASSWORD} style={{ float: 'right' }}>
        Forgot password?
      </Link>
    </>
  );

  const bottomLinksSignUp = (
    <Link to={Routes.LOGIN} style={{ float: 'right' }}>
      Log In
    </Link>
  );

  const submitLogin = (
    <Button
      type='primary'
      htmlType='submit'
      style={{ width: '100%' }}
      loading={isEmailLoading}
      disabled={isAnythingLoading}
      icon={<UnlockOutlined />}
    >
      Login using password
    </Button>
  );

  const submitSignUp = (
    <Button
      type='primary'
      htmlType='submit'
      style={{ width: '100%' }}
      loading={isEmailLoading}
      disabled={isAnythingLoading}
      icon={<UserAddOutlined />}
    >
      Sign Up using password
    </Button>
  );

  return (
    <div className='auth-container'>
      <Divider>{formRole}</Divider>
      {providersReady && <OauthSection />}
      <Form
        onFinish={isLogin ? emailLogin : emailSignUp}
        validateMessages={validateMessages}
        form={formEmail}
      >
        <Item name='email' rules={emailRules} hasFeedback>
          <Input
            prefix={<MailOutlined />}
            placeholder='Email'
            autoComplete='email'
            disabled={isAnythingLoading}
          />
        </Item>
        {!isLogin && (
          <Item name='username' rules={usernameRules} hasFeedback>
            <Input prefix={<UserOutlined />} placeholder='Username' autoComplete='name' />
          </Item>
        )}
        <Item name='password' rules={requiredRules} hasFeedback>
          <Input.Password
            placeholder='Password'
            autoComplete='current-password'
            prefix={<LockOutlined />}
            disabled={isAnythingLoading}
          />
        </Item>
        <Item>{isLogin ? submitLogin : submitSignUp}</Item>
        {isLogin ? bottomLinksLogin : bottomLinksSignUp}
      </Form>
    </div>
  );
};

export default Login;
