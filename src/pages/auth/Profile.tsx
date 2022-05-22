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
  passwordUpdateSuccess,
  passwordUpdateFailed,
} from './notifications';
import { Routes } from '../../routes';
import { passwordRules } from '../../utils/password';

const { Item } = Form;

const Profile = () => {
  const [formProfile] = Form.useForm();
  const [formPassword] = Form.useForm();
  const {
    currentUser,
    sendEmailVerification,
    updateUsername,
    updatePassword,
    getSessions,
    getLogs,
  } = useAuth();
  const navigate = useNavigate();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
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

  const onUpdateProfile = async ({ username }: { username: string }) => {
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

  const onUpdatePassword = async ({ password, oldPassword }: { password: string, oldPassword: string }) => {
    setIsPasswordLoading(true);
    try {
      await updatePassword(password, oldPassword);
      passwordUpdateSuccess();
      fetchLogs();
      formPassword.resetFields();
    } catch (error) {
      passwordUpdateFailed(error as Error);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      getSessions()
        .then((list) => setSessions(list.sessions.map((ses) => [
          ses.clientName,
          ses.osName,
          ses.deviceName,
          ses.countryName,
          ses.ip,
        ].join(' '))));

      fetchLogs();
      return;
    }

    restrictedPage();
    navigate(Routes.LOGIN);
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
        onFinish={onUpdateProfile}
        fields={[
          {
            name: 'username',
            value: currentUser?.name,
          },
          {
            name: 'email',
            value: currentUser?.email,
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
        onFinish={onUpdatePassword}
      >
        <Item
          name="oldPassword"
          rules={[{ required: true }]}
          hasFeedback
        >
          <Input.Password
            placeholder="Old password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item
          name="password"
          rules={passwordRules}
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
            loading={isPasswordLoading}
          >
            Change
          </Button>
        </Item>
      </Form>
      <Divider>Active sessions</Divider>
      <List
        size="small"
        bordered
        dataSource={sessions}
        renderItem={item => <List.Item>{item}</List.Item>}
      />
      <Divider>Audit logs</Divider>
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
