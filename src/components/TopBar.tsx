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
  Input,
  Row,
  Col,
  Tooltip,
  Grid,
  Menu,
  Dropdown,
  Typography,
  Radio,
  notification,
} from 'antd';
import {
  UserOutlined,
  ShareAltOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SettingOutlined,
  LoginOutlined,
  LineChartOutlined,
  SlidersOutlined,
  GithubOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  SaveOutlined,
  DesktopOutlined,
  GlobalOutlined,
  LinkOutlined,
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

const { Header } = Layout;
const { useBreakpoint } = Grid;
const { SubMenu } = Menu;

const TopBar = () => {
  const { sm } = useBreakpoint();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const history = useHistory();
  const matchedTabPath = useMemo(() => matchPath(pathname, { path: Routes.TAB }), [pathname]);
  const logoutClick = useCallback(async () => {
    try {
      await logout();
      notification.warning({
        message: 'Logout successful',
        description: 'See you again!',
      });
    } catch (err) {
      console.warn(err);
      notification.error({
        message: 'Login failed',
        description: (err as Error).message,
      });
    }
  }, [logout]);

  const userMenu = (
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
      <Menu.Item key="gh" icon={<GithubOutlined />}>
        <a
          href="https://github.com/speedy-tuner/speedy-tuner-cloud"
          target="__blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="preferences" disabled icon={<SettingOutlined />}>
        Preferences
      </Menu.Item>
    </Menu>
  );

  const shareMenu = (
    <Menu>
      <Menu.Item key="upload" disabled icon={<CloudUploadOutlined />}>
        Upload
      </Menu.Item>
      <SubMenu key="download-sub" title="Download" icon={<CloudDownloadOutlined />}>
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
      </SubMenu>
      <Menu.Item key="link" disabled icon={<LinkOutlined />}>
        Create link
      </Menu.Item>
      <Menu.Item key="publish" disabled icon={<GlobalOutlined />}>
        Publish to Hub
      </Menu.Item>
    </Menu>
  );

  const searchInput = useRef<Input | null>(null);
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
            <Tooltip title={
              <>
                <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                <Typography.Text keyboard>P</Typography.Text>
              </>
            }>
              <Button icon={<SearchOutlined />} ref={searchInput as any} />
            </Tooltip>
            <Dropdown
              overlay={shareMenu}
              placement="bottomCenter"
              trigger={['click']}
            >
              <Button icon={<ShareAltOutlined />}>
                <DownOutlined />
              </Button>
            </Dropdown>
            <Dropdown
              overlay={userMenu}
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
