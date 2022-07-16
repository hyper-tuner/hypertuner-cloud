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
  UserOutlined,
  GoogleOutlined,
  GithubOutlined,
  FacebookOutlined,
  UserAddOutlined,
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
  signUpFailed,
  magicLinkSent,
  signUpSuccessful,
} from './notifications';
import { passwordRules } from '../../utils/password';

const { Item } = Form;

const SignUp = () => {
  const [formMagicLink] = Form.useForm();
  const [formEmail] = Form.useForm();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const {
    currentUser,
    signUp,
    sendEmailVerification,
    googleAuth,
    githubAuth,
    facebookAuth,
    sendMagicLink,
  } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isGoogleLoading || isGithubLoading || isFacebookLoading || isMagicLinkLoading;

  const googleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await googleAuth();
    } catch (error) {
      signUpFailed(error as Error);
    }
  }, [googleAuth]);

  const githubLogin = useCallback(async () => {
    setIsGithubLoading(true);
    try {
      await githubAuth();
    } catch (error) {
      signUpFailed(error as Error);
    }
  }, [githubAuth]);

  const facebookLogin = useCallback(async () => {
    setIsFacebookLoading(true);
    try {
      await facebookAuth();
    } catch (error) {
      signUpFailed(error as Error);
    }
  }, [facebookAuth]);

  const emailSignUp = async ({ email, password, username }: { email: string, password: string, username: string }) => {
    setIsEmailLoading(true);
    try {
      const user = await signUp(email, password, username);
      await sendEmailVerification();
      signUpSuccessful();
      if (!user.emailVerification) {
        emailNotVerified();
      }
      navigate(Routes.HUB);
    } catch (error) {
      console.warn(error);
      signUpFailed(error as Error);
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
      signUpFailed(error as Error);
    } finally {
      setIsMagicLinkLoading(false);
      formMagicLink.resetFields();
      formEmail.resetFields();
    }
  };

  useEffect(() => {
    if (currentUser) {
      navigate(Routes.HUB);
    }
  }, [currentUser, navigate]);

  return (
    <div className="auth-container">
      <Divider>Sign Up</Divider>
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
        onFinish={emailSignUp}
        validateMessages={validateMessages}
        form={formEmail}
      >
        <Divider />
        <Item name="username" rules={[{ required: true }]} hasFeedback>
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            autoComplete="name"
            disabled={isAnythingLoading}
          />
        </Item>
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
          rules={passwordRules}
          hasFeedback
        >
          <Input.Password
            placeholder="Password"
            autoComplete="new-password"
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
            icon={<UserAddOutlined />}
          >
            Sign Up using password
          </Button>
        </Item>
        <Link to={Routes.LOGIN} style={{ float: 'right' }}>
          Log In
        </Link>
      </Form>
    </div>
  );
};

export default SignUp;
