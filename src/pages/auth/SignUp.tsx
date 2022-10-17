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
  signUpSuccessful,
} from './notifications';
import {
  emailRules,
  passwordRules,
} from '../../utils/form';

const { Item } = Form;

const SignUp = () => {
  const [formMagicLink] = Form.useForm();
  const [formEmail] = Form.useForm();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const {
    currentUser,
    signUp,
    googleAuth,
    githubAuth,
    facebookAuth,
  } = useAuth();
  const navigate = useNavigate();
  const isAnythingLoading = isEmailLoading || isGoogleLoading || isGithubLoading || isFacebookLoading;

  const googleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      // await googleAuth();
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

  const emailSignUp = async ({ email, password }: { email: string, password: string }) => {
    setIsEmailLoading(true);
    try {
      const user = await signUp(email, password);
      signUpSuccessful();

      if (!user.verified) {
        emailNotVerified();
      }

      navigate(Routes.HUB);
    } catch (error) {
      signUpFailed(error as Error);
      formMagicLink.resetFields();
      formEmail.resetFields();
      setIsEmailLoading(false);
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
      <Form
        onFinish={emailSignUp}
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
