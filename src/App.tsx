import {
  Routes as ReactRoutes,
  Route,
  useMatch,
} from 'react-router-dom';
import {
  Layout,
  Result,
} from 'antd';
import { connect } from 'react-redux';
import {
  lazy,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import { Routes } from './routes';
import { loadTune } from './utils/api';
import store from './store';
import Logs from './pages/Logs';
import Loader from './components/Loader';
import {
  AppState,
  NavigationState,
  TuneDataState,
  UIState,
} from './types/state';
import useDb from './hooks/useDb';
import Info from './pages/Info';
import Hub from './pages/Hub';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './css/App.less';

// TODO: fix this
// lazy loading this component causes a weird Curve canvas scaling
// const Log = lazy(() => import('./pages/Log'));

const Tune = lazy(() => import('./pages/Tune'));
const Diagnose = lazy(() => import('./pages/Diagnose'));
const Upload = lazy(() => import('./pages/Upload'));
const Login = lazy(() => import('./pages/auth/Login'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const MagicLinkConfirmation = lazy(() => import('./pages/auth/MagicLinkConfirmation'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const ResetPasswordConfirmation = lazy(() => import('./pages/auth/ResetPasswordConfirmation'));

const { Content } = Layout;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  navigation: state.navigation,
  tuneData: state.tuneData,
});

const App = ({ ui, navigation, tuneData }: { ui: UIState, navigation: NavigationState, tuneData: TuneDataState }) => {
  const margin = ui.sidebarCollapsed ? 80 : 250;
  const { getTune } = useDb();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPage = searchParams.get('redirectPage');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: refactor this
  switch (redirectPage) {
    case Routes.REDIRECT_PAGE_MAGIC_LINK_CONFIRMATION:
      window.location.href = `/#${Routes.MAGIC_LINK_CONFIRMATION}?${searchParams.toString()}`;
      break;
    case Routes.REDIRECT_PAGE_EMAIL_VERIFICATION:
      window.location.href = `/#${Routes.EMAIL_VERIFICATION}?${searchParams.toString()}`;
      break;
    case Routes.REDIRECT_PAGE_RESET_PASSWORD:
      window.location.href = `/#${Routes.RESET_PASSWORD_CONFIRMATION}?${searchParams.toString()}`;
      break;
    default:
      break;
  }

  // const [lastDialogPath, setLastDialogPath] = useState<string|null>();
  // const lastDialogPath = storageGetSync('lastDialog');

  const tunePathMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneId = tunePathMatch?.params.tuneId;

  useEffect(() => {
    if (tuneId) {
      // clear out last state
      if (tuneData && tuneId !== tuneData.id) {
        setIsLoading(true);
        loadTune(null);
        store.dispatch({ type: 'tuneData/load', payload: null });
        setIsLoading(false);
      }

      getTune(tuneId).then(async (tune) => {
        loadTune(tune);
        store.dispatch({ type: 'tuneData/load', payload: tune });
      });

      store.dispatch({ type: 'navigation/tuneId', payload: tuneId });
    }

    // storageGet('lastDialog')
    //   .then((path) => setLastDialogPath(path));

    // window.addEventListener('beforeunload', beforeUnload);
    // return () => {
    //   window.removeEventListener('beforeunload', beforeUnload);
    // };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuneId]);

  const ContentFor = useCallback((props: { element: ReactNode, marginLeft?: number }) => {
    const { element, marginLeft } = props;

    return (
      <Layout style={{ marginLeft }}>
        <Layout className="app-content">
          <Content>
            <Suspense fallback={<Loader />}>{element}</Suspense>
          </Content>
        </Layout>
      </Layout>
    );
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <Layout>
        <TopBar tuneId={navigation.tuneId} />
        <ReactRoutes>
          <Route path={Routes.HUB} element={<ContentFor element={<Hub />} />} />
          <Route path={Routes.TUNE_ROOT} element={<ContentFor element={<Info />} />} />
          <Route path={`${Routes.TUNE_TUNE}/*`} element={<ContentFor marginLeft={margin} element={<Tune />} />} />
          <Route path={Routes.TUNE_LOGS} element={<ContentFor marginLeft={margin} element={<Logs />} />} />
          <Route path={Routes.TUNE_DIAGNOSE} element={<ContentFor marginLeft={margin} element={<Diagnose />} />} />
          <Route path={Routes.UPLOAD} element={<ContentFor element={<Upload />} />} />

          <Route path={Routes.LOGIN} element={<ContentFor element={<Login />} />} />
          <Route path={Routes.PROFILE} element={<ContentFor element={<Profile />} />} />
          <Route path={Routes.SIGN_UP} element={<ContentFor element={<SignUp />} />} />
          <Route path={Routes.RESET_PASSWORD} element={<ContentFor element={<ResetPassword />} />} />

          <Route path={Routes.MAGIC_LINK_CONFIRMATION} element={<ContentFor element={<MagicLinkConfirmation />} />} />
          <Route path={Routes.EMAIL_VERIFICATION} element={<ContentFor element={<EmailVerification />} />} />
          <Route path={Routes.RESET_PASSWORD_CONFIRMATION} element={<ContentFor element={<ResetPasswordConfirmation />} />} />
        </ReactRoutes>
        <Result status="warning" title="Page not found" style={{ marginTop: 50 }} />
      </Layout>
      <StatusBar />
    </>
  );
};

export default connect(mapStateToProps)(App);
