import {
  useCallback,
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
  List,
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
  profileUpdateSuccess,
  profileUpdateFailed,
} from './notifications';
import { Routes } from '../../routes';
import { passwordPattern } from '../../utils/password';

const { Item } = Form;

const Profile = () => {
  const [formProfile] = Form.useForm();
  const [formPassword] = Form.useForm();
  const {
    currentUser,
    sendEmailVerification,
    updateUsername,
    getSessions,
    getLogs,
  } = useAuth();
  const navigate = useNavigate();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [sessions, setSessions] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

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

  const fetchLogs = useCallback(async () => getLogs()
    .then((list) => setLogs(list.logs.map((log) => [
      new Date(log.time * 1000).toLocaleString(),
      log.event,
      log.clientName,
      log.osName,
      log.deviceName,
      log.countryName,
      log.ip,
    ].join(' ')))), [getLogs]);

  const updateProfile = async ({ username }: { username: string }) => {
    setIsProfileLoading(true);
    try {
      await updateUsername(username);
      profileUpdateSuccess();
      fetchLogs();
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
    }

    getSessions()
      .then((list) => setSessions(list.sessions.map((ses) => [
        ses.clientName,
        ses.osName,
        ses.deviceName,
        ses.countryName,
        ses.ip,
      ].join(' '))));

    fetchLogs();
  }, [currentUser, fetchLogs, getLogs, getSessions, navigate]);

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
        form={formProfile}
        onFinish={updateProfile}
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
            loading={isProfileLoading}
          >
            Update
          </Button>
        </Item>
      </Form>
      <Divider>Password</Divider>
      <Form
        validateMessages={validateMessages}
        form={formPassword}
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
            Change
          </Button>
        </Item>
      </Form>
      <Divider>Active session</Divider>
      <List
        size="small"
        bordered
        dataSource={sessions}
        renderItem={item => <List.Item>{item}</List.Item>}
      />
      <Divider>Logs</Divider>
      <List
        size="small"
        bordered
        dataSource={logs}
        renderItem={item => <List.Item>{item}</List.Item>}
      />
    </div>
  );
};

export default Profile;
