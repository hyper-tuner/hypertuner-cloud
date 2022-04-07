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
  LockOutlined,
} from '@ant-design/icons';
import validateMessages from './validateMessages';
import { useAuth } from '../../contexts/AuthContext';
import {
  restrictedPage,
  sendingEmailVerificationFailed,
  emailVerificationSent,
} from './notifications';
import { Routes } from '../../routes';
import { passwordPattern } from '../../utils/password';

const { Item } = Form;

const Profile = () => {
  const { currentUser, sendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const resendEmailVerification = async () => {
    setIsSendingVerification(true);
    setIsVerificationSent(true);
    try {
      await sendEmailVerification();
      emailVerificationSent();
    } catch (error) {
      sendingEmailVerificationFailed(error as Error);
      setIsVerificationSent(false);
    }
    setIsSendingVerification(false);
  };

  useEffect(() => {
    if (!currentUser) {
      restrictedPage();
      navigate(Routes.LOGIN);
    }
  }, [currentUser, navigate]);

  return (
    <div className="auth-container">
      {!currentUser?.emailVerification && (<>
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
            Resend confirmation
          </Button>
        </Space>
      </>)}
      <Divider>Your Profile</Divider>
      <Form
        validateMessages={validateMessages}
        form={form}
        autoComplete="off"
        fields={[
          {
            name: 'username',
            value: currentUser!.name,
          },
          {
            name: 'email',
            value: currentUser!.email,
          },
        ]}
      >
        <Item
          name="username"
          rules={[{ required: true }]}
          hasFeedback
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
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
          >
            Update
          </Button>
        </Item>
      </Form>
      <Divider>Password</Divider>
      <Form
        validateMessages={validateMessages}
        form={form}
        autoComplete="off"
        fields={[
          {
            name: 'username',
            value: currentUser!.name,
          },
          {
            name: 'email',
            value: currentUser!.email,
          },
        ]}
      >
        <Item
          name="password"
          rules={[
            { required: true },
            { pattern: passwordPattern, message: 'Password is too weak!' },
          ]}
          hasFeedback
        >
          <Input.Password
            placeholder="New password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            icon={<LockOutlined />}
          >
            Change password
          </Button>
        </Item>
      </Form>
    </div>
  );
};

export default Profile;
