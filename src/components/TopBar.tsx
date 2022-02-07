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
import {
  isMac,
  isFirefox,
} from '../utils/env';
import {
  isCommand,
  isToggleSidebar,
} from '../utils/keyboard/shortcuts';
import { Routes } from '../routes';
import { useAuth } from '../contexts/AuthContext';
import {
  logOutFailed,
  logOutSuccessful,
} from '../pages/auth/notifications';

const { Header } = Layout;
const { useBreakpoint } = Grid;
const { SubMenu } = Menu;

const TopBar = ({ tuneId }: { tuneId: string | null }) => {
  const { sm, lg } = useBreakpoint();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { query } = useKBar();
  const buildTuneUrl = (route: string) => tuneId ? generatePath(route, { tuneId }) : null;
  const rootPathMatch = useMatch(Routes.ROOT);
  const tuneRootMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneTuneMatch = useMatch(`${Routes.TUNE_TUNE}/*`);
  const tabMatch = useMatch(`${Routes.TUNE_TAB}/*`);
  const uploadMatch = useMatch(Routes.UPLOAD);
  const logoutClick = useCallback(async () => {
    try {
      await logout();
      logOutSuccessful();
    } catch (error) {
      console.warn(error);
      logOutFailed(error as Error);
    }
  }, [logout]);

  const toggleCommandPalette = useCallback(() => query.toggle(), [query]);

  const handleGlobalKeyboard = useCallback((e: KeyboardEvent) => {
    if (isCommand(e)) {
      e.preventDefault();
      toggleCommandPalette();
    }

    if (isToggleSidebar(e)) {
      e.preventDefault();
      store.dispatch({ type: 'ui/toggleSidebar' });
    }
  }, [toggleCommandPalette]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyboard);

    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  });

  const tabs = useMemo(() => (
    <Col span={16} md={12} sm={16} style={{ textAlign: 'center' }}>
      <Radio.Group
        key={pathname}
        defaultValue={tuneTuneMatch?.pathnameBase || tabMatch?.pathname || tuneRootMatch?.pathname || rootPathMatch?.pathname}
        optionType="button"
        buttonStyle="solid"
        onChange={(e) => navigate(e.target.value)}
      >
        <Radio.Button value={buildTuneUrl(Routes.ROOT)}>
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
  ), [buildTuneUrl, lg, navigate, pathname, rootPathMatch?.pathname, tabMatch?.pathname, tuneRootMatch?.pathname, tuneTuneMatch?.pathnameBase]);

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
      list.push('Download');
    }

    if (sm) {
      list.push(<DownOutlined />);
    }

    return list.length ? list : null;
  }, [lg, sm]);

  return (
    <Header className="app-top-bar">
      <Row>
        <Col span={0} md={4} sm={0} />
        {tuneId ? tabs : <Col span={10} md={10} sm={16} />}
        <Col {...rightMenuColProps} style={{ textAlign: 'right' }}>
          <Space>
            {sm && <Tooltip title={
              isFirefox ?
                (<>
                  <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                  <Typography.Text keyboard>K</Typography.Text>
                </>)
                :
                (<>
                  <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                  <Typography.Text keyboard>SHIFT</Typography.Text>
                  <Typography.Text keyboard>P</Typography.Text>
                </>)
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
              placement="bottomCenter"
              trigger={['click']}
            >
              <Button icon={<CloudDownloadOutlined />}>
                {downloadButton}
              </Button>
            </Dropdown>
            <Dropdown
              overlay={
                <Menu>
                  {currentUser ? (
                    <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logoutClick}>
                      Logout
                    </Menu.Item>
                  ) : (
                    <>
                      <Menu.Item key="login" icon={<LoginOutlined />}>
                        <Link to={Routes.LOGIN}>Login</Link>
                      </Menu.Item>
                      <Menu.Item key="sign-up" icon={<UserAddOutlined />}>
                        <Link to={Routes.SIGN_UP}>Sign Up</Link>
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item key="preferences" disabled icon={<SettingOutlined />}>
                    Preferences
                  </Menu.Item>
                </Menu>
              }
              placement="bottomCenter"
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
