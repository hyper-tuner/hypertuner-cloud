import {
  CarOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DesktopOutlined,
  DownOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FundOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  SettingOutlined,
  SlidersOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Col, Dropdown, Grid, Layout, Radio, Row, Space, Tooltip, Typography } from 'antd';
import { useKBar } from 'kbar';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, generatePath, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Collections } from '../@types/pocketbase-types';
import { useAuth } from '../contexts/AuthContext';
import useDb from '../hooks/useDb';
import useServerStorage from '../hooks/useServerStorage';
import { logOutSuccessful } from '../pages/auth/notifications';
import { removeFilenameSuffix } from '../pocketbase';
import { Routes } from '../routes';
import store from '../store';
import { TuneDataState } from '../types/state';
import { isMac } from '../utils/env';
import { isToggleSidebar } from '../utils/keyboard/shortcuts';
import { buildHyperTunerAppLink } from '../utils/url';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const logsExtensionsIcons: { [key: string]: React.JSX.Element } = {
  mlg: <FileZipOutlined />,
  msl: <FileTextOutlined />,
  csv: <FileExcelOutlined />,
};

const TopBar = ({
  tuneData,
}: {
  tuneData: TuneDataState | null;
}) => {
  const { xs, sm, lg } = useBreakpoint();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { query } = useKBar();
  const buildTuneUrl = useCallback(
    (route: string) => (tuneData?.tuneId ? generatePath(route, { tuneId: tuneData.tuneId }) : null),
    [tuneData?.tuneId],
  );
  const hubPathMatch = useMatch(Routes.HUB);
  const tuneRootMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneTuneMatch = useMatch(`${Routes.TUNE_TUNE}/*`);
  const tuneLogMatch = useMatch(`${Routes.TUNE_LOGS}/*`);
  const toothLogMatch = useMatch(`${Routes.TUNE_DIAGNOSE}/*`);
  const tabMatch = useMatch(`${Routes.TUNE_TAB}/*`);
  const uploadMatch = useMatch(Routes.UPLOAD);
  const hubMatch = useMatch(Routes.HUB);
  const { downloadFile } = useServerStorage();
  const { getIni } = useDb();
  const downloadAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const logoutClick = useCallback(() => {
    logout();
    logOutSuccessful();
    navigate(0);
  }, [logout, navigate]);

  const toggleCommandPalette = useCallback(() => query.toggle(), [query]);

  const handleGlobalKeyboard = useCallback((e: KeyboardEvent) => {
    if (isToggleSidebar(e)) {
      e.preventDefault();
      store.dispatch({ type: 'ui/toggleSidebar' });
    }
  }, []);

  const downloadLogsItems = {
    label: 'Logs',
    icon: <LineChartOutlined />,
    key: 'logs',
    children: (tuneData?.logFiles || []).map((filename) => ({
      key: filename,
      label: removeFilenameSuffix(filename),
      icon: logsExtensionsIcons[filename.slice(-3)],
      onClick: () =>
        downloadFile(Collections.Tunes, tuneData!.id, filename, downloadAnchorRef.current!),
    })),
  };

  const downloadToothLogsItems = {
    label: 'Tooth logs',
    icon: <SettingOutlined />,
    key: 'toothLogs',
    children: (tuneData?.toothLogFiles || []).map((filename) => ({
      key: filename,
      label: removeFilenameSuffix(filename),
      icon: logsExtensionsIcons[filename.slice(-3)],
      onClick: () =>
        downloadFile(Collections.Tunes, tuneData!.id, filename, downloadAnchorRef.current!),
    })),
  };

  const downloadItems = [
    {
      label: 'Open in app',
      icon: <DesktopOutlined />,
      key: 'open',
      disabled: false,
      onClick: () => window.open(buildHyperTunerAppLink(tuneData!.tuneId)),
    },
    {
      label: 'Tune',
      icon: <SlidersOutlined />,
      key: 'tune',
      children: [
        {
          label: 'Download',
          icon: <FileTextOutlined />,
          key: 'download',
          onClick: () =>
            downloadFile(
              Collections.Tunes,
              tuneData!.id,
              tuneData!.tuneFile,
              downloadAnchorRef.current!,
            ),
        },
      ],
    },
    {
      label: 'INI',
      icon: <FileTextOutlined />,
      key: 'ini',
      onClick: async () => {
        if (tuneData?.customIniFile) {
          downloadFile(
            Collections.Tunes,
            tuneData!.id,
            tuneData!.customIniFile,
            downloadAnchorRef.current!,
          );
        } else {
          const ini = await getIni(tuneData!.signature);
          downloadFile(Collections.IniFiles, ini!.id, ini!.file, downloadAnchorRef.current!);
        }
      },
    },
    (tuneData?.logFiles || []).length > 0 ? { ...downloadLogsItems } : null,
    (tuneData?.toothLogFiles || []).length > 0 ? { ...downloadToothLogsItems } : null,
  ];

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyboard);

    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  }, [currentUser, handleGlobalKeyboard]);

  const tabs = useMemo(
    () => (
      <Col span={16} md={16} sm={16}>
        <Radio.Group
          key={pathname}
          defaultValue={
            tuneLogMatch?.pathnameBase ||
            toothLogMatch?.pathnameBase ||
            tuneTuneMatch?.pathnameBase ||
            tabMatch?.pathname ||
            tuneRootMatch?.pathname ||
            hubPathMatch?.pathname
          }
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
          <Radio.Button
            value={buildTuneUrl(Routes.TUNE_LOGS)}
            disabled={(tuneData?.logFiles || []).length === 0}
          >
            <Space>
              <FundOutlined />
              {lg && 'Logs'}
            </Space>
          </Radio.Button>
          <Radio.Button
            value={buildTuneUrl(Routes.TUNE_DIAGNOSE)}
            disabled={(tuneData?.toothLogFiles || []).length === 0}
          >
            <Space>
              <SettingOutlined />
              {lg && 'Diagnose'}
            </Space>
          </Radio.Button>
        </Radio.Group>
      </Col>
    ),
    [
      pathname,
      tuneLogMatch?.pathnameBase,
      toothLogMatch?.pathnameBase,
      tuneTuneMatch?.pathnameBase,
      tabMatch?.pathname,
      tuneRootMatch?.pathname,
      hubPathMatch?.pathname,
      buildTuneUrl,
      lg,
      tuneData?.logFiles,
      tuneData?.toothLogFiles,
      navigate,
    ],
  );

  const rightMenuColProps = tuneData?.tuneId
    ? {
        span: 8,
        md: 8,
        sm: 8,
      }
    : {
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

  const userAuthMenuItems = useMemo(() => {
    return currentUser
      ? [
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
            onClick: () => navigate(Routes.PROFILE),
          },
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: logoutClick,
          },
        ]
      : [
          {
            key: 'login',
            icon: <LoginOutlined />,
            label: 'Login',
            onClick: () => navigate(Routes.LOGIN),
          },
          {
            key: 'sign-up',
            icon: <UserAddOutlined />,
            label: 'Sign Up',
            onClick: () => navigate(Routes.SIGN_UP),
          },
        ];
  }, [currentUser, logoutClick, navigate]);

  const userMenuItems = [
    ...userAuthMenuItems,
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: 'About',
      onClick: () => navigate(Routes.ABOUT),
    },
  ];

  return (
    <Header className="app-top-bar" style={xs ? { padding: '0 5px' } : {}}>
      <Row>
        {tuneData?.tuneId ? (
          tabs
        ) : (
          <Col span={10} md={14} sm={16}>
            <Link to={Routes.HUB}>
              <Button icon={<CarOutlined />} type={hubMatch ? 'primary' : 'default'}>
                Hub
              </Button>
            </Link>
          </Col>
        )}
        <Col {...rightMenuColProps} style={{ textAlign: 'right' }}>
          <Space>
            {sm && (
              <Tooltip
                title={
                  <>
                    <Typography.Text keyboard>{isMac ? '⌘' : 'CTRL'}</Typography.Text>
                    <Typography.Text keyboard>K</Typography.Text>
                  </>
                }
              >
                <Button icon={<SearchOutlined />} onClick={toggleCommandPalette} />
              </Tooltip>
            )}
            <Link to={Routes.UPLOAD}>
              <Button icon={<CloudUploadOutlined />} type={uploadMatch ? 'primary' : 'default'}>
                {lg && 'Upload'}
              </Button>
            </Link>
            {tuneData?.tuneId && (
              <Dropdown menu={{ items: downloadItems }} placement="bottom" trigger={['click']}>
                <Button icon={<CloudDownloadOutlined />}>{downloadButton}</Button>
              </Dropdown>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button icon={<UserOutlined />}>{sm && <DownOutlined />}</Button>
            </Dropdown>
            {/* dummy anchor for file download */}
            <a href="#download" ref={downloadAnchorRef} style={{ display: 'none' }}>
              download
            </a>
          </Space>
        </Col>
      </Row>
    </Header>
  );
};

export default TopBar;
