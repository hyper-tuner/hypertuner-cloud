import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  useLocation,
  useNavigate,
  Link,
  generatePath,
  useMatch,
} from 'react-router-dom';
import {
  Layout,
  Space,
  Button,
  Row,
  Col,
  Tooltip,
  Grid,
  Menu,
  Dropdown,
  Typography,
  Radio,
} from 'antd';
import {
  UserOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SettingOutlined,
  LoginOutlined,
  LineChartOutlined,
  SlidersOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  SaveOutlined,
  DesktopOutlined,
  DownOutlined,
  SearchOutlined,
  ToolOutlined,
  FundOutlined,
  UserAddOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useKBar } from 'kbar';
import store from '../store';
import { isMac } from '../utils/env';
import { isToggleSidebar } from '../utils/keyboard/shortcuts';
import { Routes } from '../routes';
import { useAuth } from '../contexts/AuthContext';
import { logOutSuccessful } from '../pages/auth/notifications';

const { Header } = Layout;
const { useBreakpoint } = Grid;
const { SubMenu } = Menu;

const TopBar = ({ tuneId }: { tuneId: string | null }) => {
  const { xs, sm, lg } = useBreakpoint();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { query } = useKBar();
  const buildTuneUrl = useCallback((route: string) => tuneId ? generatePath(route, { tuneId }) : null, [tuneId]);
  const hubPathMatch = useMatch(Routes.HUB);
  const tuneRootMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneTuneMatch = useMatch(`${Routes.TUNE_TUNE}/*`);
  const tabMatch = useMatch(`${Routes.TUNE_TAB}/*`);
  const uploadMatch = useMatch(Routes.UPLOAD);
  const hubMatch = useMatch(Routes.HUB);
  const logoutClick = useCallback(() => {
    logout();
    logOutSuccessful();
    navigate(Routes.HUB);
  }, [logout, navigate]);

  const toggleCommandPalette = useCallback(() => query.toggle(), [query]);

  const handleGlobalKeyboard = useCallback((e: KeyboardEvent) => {
    if (isToggleSidebar(e)) {
      e.preventDefault();
      store.dispatch({ type: 'ui/toggleSidebar' });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyboard);

    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  }, [currentUser, handleGlobalKeyboard]);

  const tabs = useMemo(() => (
    <Col span={16} md={16} sm={16}>
      <Radio.Group
        key={pathname}
        defaultValue={tuneTuneMatch?.pathnameBase || tabMatch?.pathname || tuneRootMatch?.pathname || hubPathMatch?.pathname}
        optionType="button"
        buttonStyle="solid"
        onChange={(e) => navigate(e.target.value)}
      >
        <Radio.Button value={buildTuneUrl(Routes.HUB)}>
          <Space>
            <CarOutlined />
            {lg && 'Hub'}
          </Space>
        </Radio.Button>
        <Radio.Button value={buildTuneUrl(Routes.TUNE_ROOT)}>
          <Space>
            <InfoCircleOutlined />
            {lg && 'Info'}
          </Space>
        </Radio.Button>
        <Radio.Button value={buildTuneUrl(Routes.TUNE_TUNE)}>
          <Space>
            <ToolOutlined />
            {lg && 'Tune'}
          </Space>
        </Radio.Button>
        <Radio.Button value={buildTuneUrl(Routes.TUNE_LOGS)}>
          <Space>
            <FundOutlined />
            {lg && 'Logs'}
          </Space>
        </Radio.Button>
        <Radio.Button value={buildTuneUrl(Routes.TUNE_DIAGNOSE)}>
          <Space>
            <SettingOutlined />
            {lg && 'Diagnose'}
          </Space>
        </Radio.Button>
      </Radio.Group>
    </Col>
  ), [buildTuneUrl, lg, navigate, pathname, hubPathMatch?.pathname, tabMatch?.pathname, tuneRootMatch?.pathname, tuneTuneMatch?.pathnameBase]);

  const rightMenuColProps = tuneId ? {
    span: 8,
    md: 8,
    sm: 8,
  } : {
    span: 14,
    md: 10,
    sm: 8,
  };

  const downloadButton = useMemo(() => {
    const list = [];

    if (lg) {
      list.push(<span key="download-text">Download</span>);
    }

    if (sm) {
      list.push(<DownOutlined key="download-icon" />);
    }

    return list.length ? list : null;
  }, [lg, sm]);

  const userMenuItems = useMemo(() => currentUser ? [{
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
    onClick: () => navigate(Routes.PROFILE),
  }, {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Logout',
    onClick: logoutClick,
  }] : [{
    key: 'login',
    icon: <LoginOutlined />,
    label: 'Login',
    onClick: () => navigate(Routes.LOGIN),
  }, {
    key: 'sign-up',
    icon: <UserAddOutlined />,
    label: 'Sign Up',
    onClick: () => navigate(Routes.SIGN_UP),
  }], [currentUser, logoutClick, navigate]);

  return (
    <Header className="app-top-bar" style={xs ? { padding: '0 5px' } : {}}>
      <Row>
        {tuneId ? tabs : (
          <Col span={10} md={14} sm={16}>
            <Link to={Routes.HUB}>
              <Button icon={<CarOutlined />} type={hubMatch ? 'primary' : 'default'}>Hub</Button>
            </Link>
          </Col>
        )}
        <Col {...rightMenuColProps} style={{ textAlign: 'right' }}>
          <Space>
            {sm && <Tooltip title={
              <>
                <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                <Typography.Text keyboard>K</Typography.Text>
              </>
            }>
              <Button icon={<SearchOutlined />} onClick={toggleCommandPalette} />
            </Tooltip>}
            <Link to={Routes.UPLOAD}>
              <Button icon={<CloudUploadOutlined />} type={uploadMatch ? 'primary' : 'default'}>
                {lg && 'Upload'}
              </Button>
            </Link>
            <Dropdown
              overlay={
                <Menu disabled>
                  <SubMenu key="tune-sub" title="Tune" icon={<SlidersOutlined />}>
                    <Menu.Item key="download" icon={<SaveOutlined />}>
                      <a href="/tunes/202103.msq" target="__blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </Menu.Item>
                    <Menu.Item key="open" disabled icon={<DesktopOutlined />}>
                      Open in app
                    </Menu.Item>
                  </SubMenu>
                  <SubMenu key="logs-sub" title="Logs" icon={<LineChartOutlined />}>
                    <Menu.Item key="mlg" disabled icon={<FileZipOutlined />}>
                      MLG
                    </Menu.Item>
                    <Menu.Item key="msl" disabled icon={<FileTextOutlined />}>
                      MSL
                    </Menu.Item>
                    <Menu.Item key="csv" disabled icon={<FileExcelOutlined />}>
                      CSV
                    </Menu.Item>
                  </SubMenu>
                </Menu>
              }
              placement="bottom"
              trigger={['click']}
            >
              <Button icon={<CloudDownloadOutlined />}>
                {downloadButton}
              </Button>
            </Dropdown>
            <Dropdown
              overlay={<Menu items={userMenuItems} />}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button icon={<UserOutlined />}>
                {sm && <DownOutlined />}
              </Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>
    </Header>
  );
};

export default TopBar;
