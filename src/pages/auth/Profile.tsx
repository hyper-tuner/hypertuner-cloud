import {
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Divider,
  Alert,
  Space,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
} from '@ant-design/icons';
import validateMessages from './validateMessages';
import { useAuth } from '../../contexts/AuthContext';
import {
  restrictedPage,
  sendingEmailVerificationFailed,
  emailVerificationSent,
  profileUpdateSuccess,
  profileUpdateFailed,
} from './notifications';
import { Routes } from '../../routes';
import { usernameRules } from '../../utils/form';

const { Item } = Form;

const Profile = () => {
  const [formProfile] = Form.useForm();
  const {
    currentUser,
    sendEmailVerification,
    updateUsername,
    refreshUser,
  } = useAuth();
  const navigate = useNavigate();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const resendEmailVerification = async () => {
    setIsSendingVerification(true);
    setIsVerificationSent(true);
    try {
      await sendEmailVerification();
      emailVerificationSent();
    } catch (error) {
      sendingEmailVerificationFailed(error as Error);
      setIsVerificationSent(false);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const onUpdateProfile = async ({ username }: { username: string }) => {
    setIsProfileLoading(true);
    try {
      await updateUsername(username);
      profileUpdateSuccess();
      refreshUser();
    } catch (error) {
      profileUpdateFailed(error as Error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      restrictedPage();
      navigate(Routes.LOGIN);

      return;
    }

    refreshUser().then((user) => {
      if (currentUser === null || user === null) {
        restrictedPage();
        navigate(Routes.LOGIN);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-container">
      {!currentUser?.verified && (<>
        <Divider>Email verification</Divider>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert message="Your email address is not verified!" type="error" showIcon />
          <Button
            type="primary"
            style={{ width: '100%' }}
            icon={<MailOutlined />}
            disabled={isVerificationSent}
            loading={isSendingVerification}
            onClick={resendEmailVerification}
          >
            Resend verification
          </Button>
        </Space>
      </>)}
      <Divider>Your Profile</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {(currentUser?.profile?.username?.length || 0) === 0 && <Alert message="Remember to set your username!" type="error" showIcon />}
        <Form
          validateMessages={validateMessages}
          form={formProfile}
          onFinish={onUpdateProfile}
          fields={[
            {
              name: 'username',
              value: currentUser?.profile?.username,
            },
            {
              name: 'email',
              value: currentUser?.email,
            },
          ]}
        >
          <Item
            name="username"
            rules={usernameRules}
            hasFeedback
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              autoComplete="name"
            />
          </Item>
          <Item name="email">
            <Input prefix={<MailOutlined />} placeholder="Email" disabled />
          </Item>
          <Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              icon={<UserOutlined />}
              loading={isProfileLoading}
            >
              Update
            </Button>
          </Item>
        </Form>
      </Space>
    </div>
  );
};

export default Profile;
