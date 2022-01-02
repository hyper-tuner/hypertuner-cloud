
import {
  useLocation,
  Switch,
  Route,
  matchPath,
  Redirect,
  generatePath,
} from 'react-router-dom';
import {
  Layout,
  Result,
} from 'antd';
import { connect } from 'react-redux';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  AppState,
  UIState,
  Config as ConfigType,
} from '@speedy-tuner/types';
import Dialog from './components/Dialog';
import { loadAll } from './utils/api';
import SideBar, { DialogMatchedPathType } from './components/SideBar';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import './App.less';
import { Routes } from './routes';
import Log from './pages/Log';
import Diagnose from './pages/Diagnose';
import useStorage from './hooks/useStorage';
import useConfig from './hooks/useConfig';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import Upload from './pages/Upload';

const { Content } = Layout;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
});

const App = ({ ui, config }: { ui: UIState, config: ConfigType }) => {
  const margin = ui.sidebarCollapsed ? 80 : 250;
  // const [lastDialogPath, setLastDialogPath] = useState<string|null>();
  const { pathname } = useLocation();
  const { storageGetSync } = useStorage();
  const { isConfigReady } = useConfig(config);
  const lastDialogPath = storageGetSync('lastDialog');
  const dialogMatchedPath: DialogMatchedPathType = useMemo(() => matchPath(pathname, {
    path: Routes.DIALOG,
    exact: true,
  }) || { url: '', params: { category: '', dialog: '' } }, [pathname]);

  const firstDialogPath = useMemo(() => {
    if (!isConfigReady) {
      return null;
    }

    const firstCategory = Object.keys(config.menus)[0];
    const firstDialog = Object.keys(config.menus[firstCategory].subMenus)[0];
    return generatePath(Routes.DIALOG, { category: firstCategory, dialog: firstDialog });
  }, [config.menus, isConfigReady]);

  useEffect(() => {
    loadAll();
    // storageGet('lastDialog')
    //   .then((path) => setLastDialogPath(path));

    // window.addEventListener('beforeunload', beforeUnload);
    // return () => {
    //   window.removeEventListener('beforeunload', beforeUnload);
    // };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ContentFor = useCallback((props: { children: ReactNode, marginLeft?: number }) => {
    const { children, marginLeft } = props;

    return (
      <Layout style={{ marginLeft }}>
        <Layout className="app-content">
          <Content>
            {children}
          </Content>
        </Layout>
      </Layout>
    );
  }, []);

  return (
    <>
      <Layout>
        <TopBar />
        <Switch>
          <Route path={Routes.ROOT} exact>
            <Redirect to={lastDialogPath || Routes.TUNE} />
          </Route>
          <Route path={Routes.TUNE}>
            <Route path={Routes.TUNE} exact>
              {firstDialogPath && <Redirect to={lastDialogPath || firstDialogPath} />}
            </Route>
            <Layout style={{ marginLeft: margin }}>
              <SideBar matchedPath={dialogMatchedPath} />
              <Layout className="app-content">
                <Content>
                  <Dialog
                    name={dialogMatchedPath.params.dialog}
                    url={dialogMatchedPath.url}
                  />
                </Content>
              </Layout>
            </Layout>
          </Route>
          <Route path={Routes.LOG}>
            <ContentFor marginLeft={margin}>
              <Log />
            </ContentFor>
          </Route>
          <Route path={Routes.DIAGNOSE}>
            <ContentFor marginLeft={margin}>
              <Diagnose />
            </ContentFor>
          </Route>
          <Route path={Routes.LOGIN}>
            <ContentFor>
              <Login />
            </ContentFor>
          </Route>
          <Route path={Routes.SIGN_UP}>
            <ContentFor>
              <SignUp />
            </ContentFor>
          </Route>
          <Route path={Routes.RESET_PASSWORD}>
            <ContentFor>
              <ResetPassword />
            </ContentFor>
          </Route>
          <Route path={Routes.UPLOAD}>
            <ContentFor>
              <Upload />
            </ContentFor>
          </Route>
        </Switch>
        <Result
          status="warning"
          title="Page not found"
          style={{ marginTop: 50 }}
        />
      </Layout>
      <StatusBar />
    </>
  );
};

export default connect(mapStateToProps)(App);
