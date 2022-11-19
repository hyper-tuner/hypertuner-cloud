import {
  useEffect,
  useState,
} from 'react';
import {
  generatePath,
  useNavigate,
} from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Divider,
  Alert,
  Space,
  List,
  Pagination,
  Typography,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  ArrowRightOutlined,
  EditOutlined,
  GlobalOutlined,
  EyeOutlined,
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
import { formatTime } from '../../utils/time';
import useDb from '../../hooks/useDb';
import { aspirationMapper } from '../../utils/tune/mappers';
import {
  TunesResponse,
  TunesVisibilityOptions,
} from '../../@types/pocketbase-types';
import TuneTag from '../../components/TuneTag';

const { Item } = Form;

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const Profile = () => {
  const [formProfile] = Form.useForm();
  const {
    currentUser,
    sendEmailVerification,
    updateUsername,
    refreshUser,
  } = useAuth();
  const navigate = useNavigate();
  const { getUserTunes } = useDb();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isTunesLoading, setIsTunesLoading] = useState(false);
  const [tunesDataSource, setTunesDataSource] = useState<TunesResponse[]>([]);

  const goToEdit = (tuneId: string) => navigate(generatePath(Routes.UPLOAD_WITH_TUNE_ID, {
    tuneId,
  }));

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

  const loadData = async () => {
    setIsTunesLoading(true);
    try {
      const { items, totalItems } = await getUserTunes(currentUser!.id, page, pageSize);
      setTotal(totalItems);
      const mapped = items.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        displacement: `${tune.displacement}l`,
        aspiration: aspirationMapper[tune.aspiration],
        updated: formatTime(tune.updated),
      }));
      setTunesDataSource(mapped as any);
    } catch (error) {
      // request cancelled
    } finally {
      setIsTunesLoading(false);
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

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <>
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
          <Form
            validateMessages={validateMessages}
            form={formProfile}
            onFinish={onUpdateProfile}
            fields={[
              {
                name: 'username',
                value: currentUser?.username,
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
      <div className="small-container">
        <Divider>Your tunes</Divider>
        <List
          dataSource={tunesDataSource}
          loading={isTunesLoading}
          renderItem={(tune) => (
            <List.Item
              actions={[
                tune.visibility === TunesVisibilityOptions.public ? <GlobalOutlined /> : <EyeOutlined />,
                <Button icon={<EditOutlined />} onClick={() => goToEdit(tune.tuneId)} />,
                <Button icon={<ArrowRightOutlined />} onClick={() => navigate(tunePath(tune.tuneId))} />,
              ]}
            >
              <Space direction="vertical">
                <List.Item.Meta
                  title={
                    <Space direction="vertical">
                      {tune.vehicleName}
                      <TuneTag tag={tune.tags} />
                      <Typography.Text italic>{tune.signature}</Typography.Text>
                    </Space>
                  }
                  description={
                    <>
                      {tune.engineMake}, {tune.engineCode}, {tune.displacement}, {tune.aspiration}
                    </>
                  }
                />
                <div>
                  <Typography.Text italic>{tune.updated}</Typography.Text>
                </div>
              </Space>
            </List.Item>
          )}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Pagination
                style={{ marginTop: 10 }}
                pageSize={pageSize}
                current={page}
                total={total}
                onChange={(newPage, newPageSize) => {
                  setIsTunesLoading(true);
                  setPage(newPage);
                  setPageSize(newPageSize);
                }}
              />
            </div>
          }
        />
      </div>
    </>
  );
};

export default Profile;
