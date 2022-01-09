import {
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import {
  Layout,
  Result,
  Skeleton,
} from 'antd';
import { connect } from 'react-redux';
import {
  lazy,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
} from 'react';
import {
  AppState,
  UIState,
  Config as ConfigType,
} from '@speedy-tuner/types';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import { Routes } from './routes';
import useStorage from './hooks/useStorage';
import { loadAll } from './utils/api';
import Log from './pages/Log';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './App.less';

// TODO: fix this
// lazy loading this component causes a weird Curve canvas scaling
// const Log = lazy(() => import('./pages/Log'));

const Tune = lazy(() => import('./pages/Tune'));
const Diagnose = lazy(() => import('./pages/Diagnose'));
const Login = lazy(() => import('./pages/auth/Login'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Upload = lazy(() => import('./pages/Upload'));

const { Content } = Layout;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
});

const App = ({ ui, config }: { ui: UIState, config: ConfigType }) => {
  const margin = ui.sidebarCollapsed ? 80 : 250;
  // const [lastDialogPath, setLastDialogPath] = useState<string|null>();
  const { storageGetSync } = useStorage();
  const lastDialogPath = storageGetSync('lastDialog');

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
            <Suspense fallback={<Skeleton
              active
              style={{
                maxWidth: 600,
                margin: '0 auto',
                padding: 20,
              }}
            />}>
              {children}
            </Suspense>
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
            <ContentFor marginLeft={margin}>
              <Tune />
            </ContentFor>
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
