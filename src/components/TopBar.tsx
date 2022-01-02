import {
  matchPath,
  useLocation,
  useHistory,
} from 'react-router';
import { Link } from 'react-router-dom';
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
} from '@ant-design/icons';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import store from '../store';
import { isMac } from '../utils/env';
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

const TopBar = () => {
  const { sm, lg } = useBreakpoint();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const history = useHistory();
  const matchedTabPath = useMemo(() => matchPath(pathname, { path: Routes.TAB }), [pathname]);
  const logoutClick = useCallback(async () => {
    try {
      await logout();
      logOutSuccessful();
    } catch (error) {
      console.warn(error);
      logOutFailed(error as Error);
    }
  }, [logout]);

  const searchInput = useRef<HTMLElement | null>(null);
  const handleGlobalKeyboard = (e: KeyboardEvent) => {
    if (isCommand(e)) {
      if (searchInput) {
        e.preventDefault();
        searchInput.current!.focus();
      }
    }

    if (isToggleSidebar(e)) {
      e.preventDefault();
      store.dispatch({ type: 'ui/toggleSidebar' });
    }
  };
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyboard);

    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  });

  return (
    <Header className="app-top-bar">
      <Row>
        <Col span={0} md={6} sm={0} />
        <Col span={12} md={10} sm={16} style={{ textAlign: 'center' }}>
          <Radio.Group
            key={pathname}
            defaultValue={matchedTabPath?.url}
            optionType="button"
            buttonStyle="solid"
            onChange={(e) => history.push(e.target.value)}
          >
            <Radio.Button value={Routes.TUNE}>
              <Space>
                <ToolOutlined />
                {sm && 'Tune'}
              </Space>
            </Radio.Button>
            <Radio.Button value={Routes.LOG}>
              <Space>
                <FundOutlined />
                {sm && 'Log'}
              </Space>
            </Radio.Button>
            <Radio.Button value={Routes.DIAGNOSE}>
              <Space>
                <SettingOutlined />
                {sm && 'Diagnose'}
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Col>
        <Col span={12} md={8} sm={8} style={{ textAlign: 'right' }}>
          <Space>
            <Tooltip visible={false} title={
              <>
                <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                <Typography.Text keyboard>SHIFT</Typography.Text>
                <Typography.Text keyboard>P</Typography.Text>
              </>
            }>
              <Button disabled icon={<SearchOutlined />} ref={searchInput} />
            </Tooltip>
            <Link to={Routes.UPLOAD}>
              <Button icon={<CloudUploadOutlined />}>
                {lg && 'Upload'}
              </Button>
            </Link>
            <Dropdown
              overlay={
                <Menu>
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
                {lg && 'Download'}
                <DownOutlined />
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
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>
    </Header>
  );
};

export default TopBar;
