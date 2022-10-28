import {
  Routes as ReactRoutes,
  Route,
  useMatch,
  useNavigate,
  generatePath,
} from 'react-router-dom';
import {
  Layout,
  Result,
} from 'antd';
import { connect } from 'react-redux';
import { INI } from '@hyper-tuner/ini';
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
import store from './store';
import Loader from './components/Loader';
import {
  AppState,
  TuneDataState,
  UIState,
} from './types/state';
import useDb from './hooks/useDb';
import Info from './pages/Info';
import Hub from './pages/Hub';
import { FormRoles } from './pages/auth/Login';
import useServerStorage from './hooks/useServerStorage';
import { TunesRecordFull } from './types/dbData';
import TuneParser from './utils/tune/TuneParser';
import standardDialogs from './data/standardDialogs';
import help from './data/help';
import {
  iniLoadingError,
  tuneParsingError,
} from './pages/auth/notifications';
import { divider } from './data/constants';
import {
  collapsedSidebarWidth,
  sidebarWidth,
} from './components/Tune/SideBar';

import 'uplot/dist/uPlot.min.css';
import 'react-perfect-scrollbar/dist/css/styles.css';
import './css/App.less';

const Tune = lazy(() => import('./pages/Tune'));
const Logs = lazy(() => import('./pages/Logs'));
const Diagnose = lazy(() => import('./pages/Diagnose'));
const Upload = lazy(() => import('./pages/Upload'));
const Login = lazy(() => import('./pages/auth/Login'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ResetPasswordConfirmation = lazy(() => import('./pages/auth/ResetPasswordConfirmation'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const OauthCallback = lazy(() => import('./pages/auth/OauthCallback'));

const { Content } = Layout;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  tuneData: state.tuneData,
});

const App = ({ ui, tuneData }: { ui: UIState, tuneData: TuneDataState }) => {
  const margin = ui.sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth;
  const { getTune } = useDb();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const tunePathMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneId = tunePathMatch?.params.tuneId;
  const { fetchINIFile, fetchTuneFile } = useServerStorage();

  const loadTune = async (data: TunesRecordFull | null) => {
    if (data === null) {
      store.dispatch({ type: 'config/load', payload: null });
      store.dispatch({ type: 'tune/load', payload: null });

      return;
    }

    const tuneRaw = await fetchTuneFile(data.id, data.tuneFile);
    const tuneParser = new TuneParser().parse(tuneRaw);

    if (!tuneParser.isValid()) {
      tuneParsingError();
      navigate(Routes.HUB);

      return;
    }

    const tune = tuneParser.getTune();
    try {
      const iniRaw = data.customIniFile ? fetchTuneFile(data.id, data.customIniFile) : fetchINIFile(data.signature);
      const config = new INI(await iniRaw).parse().getResults();

      // override / merge standard dialogs, constants and help
      config.dialogs = {
        ...config.dialogs,
        ...standardDialogs,
      };
      config.help = {
        ...config.help,
        ...help,
      };
      config.constants.pages[0].data.divider = divider;

      store.dispatch({ type: 'config/load', payload: config });
      store.dispatch({ type: 'tune/load', payload: tune });
    } catch (error) {
      iniLoadingError((error as Error));
      navigate(Routes.HUB);
    }
  };

  useEffect(() => {
    // Handle external redirects (oauth, etc)
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPage = searchParams.get('redirect');
    switch (redirectPage) {
      case Routes.REDIRECT_PAGE_OAUTH_CALLBACK:
        window.location.href = `/#${generatePath(Routes.OAUTH_CALLBACK, { provider: searchParams.get('provider')! })}?${searchParams.toString()}`;
        break;
      default:
        break;
    }

    if (tuneId) {
      // clear out last state
      if (tuneData && tuneId !== tuneData.tuneId) {
        setIsLoading(true);
        loadTune(null);
        store.dispatch({ type: 'tuneData/load', payload: null });
        store.dispatch({ type: 'logs/load', payload: {} });
        store.dispatch({ type: 'toothLogs/load', payload: {} });
        setIsLoading(false);
      }

      getTune(tuneId).then(async (tune) => {
        if (!tune) {
          console.warn('Tune not found');
          navigate(Routes.HUB);
          return;
        }

        loadTune(tune!);
        store.dispatch({ type: 'tuneData/load', payload: JSON.parse(JSON.stringify(tune)) });
      });

      store.dispatch({ type: 'navigation/tuneId', payload: tuneId });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuneId]);

  const ContentFor = useCallback((props: { element: ReactNode, marginLeft?: number, bottomOffset?: boolean }) => {
    const { element, marginLeft, bottomOffset } = props;

    return (
      <Layout style={{ marginLeft }}>
        <Layout className="app-content">
          <Content>
            <Suspense fallback={<Loader />}>{element}</Suspense>
            {/* dummy element to mitigate mobile browsers navbar offset */}
            {!bottomOffset && <div style={{ marginTop: 60 }}>&nbsp;</div>}
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
        <TopBar tuneData={tuneData} />
        <ReactRoutes>
          <Route path={Routes.HUB} element={<ContentFor element={<Hub />} />} />
          <Route path={Routes.TUNE_ROOT} element={<ContentFor element={<Info />} />} />
          <Route path={`${Routes.TUNE_TUNE}/*`} element={<ContentFor marginLeft={margin} element={<Tune />} />} />
          <Route path={Routes.TUNE_LOGS} element={<ContentFor marginLeft={margin} bottomOffset element={<Logs />} />} />
          <Route path={Routes.TUNE_LOGS_FILE} element={<ContentFor marginLeft={margin} bottomOffset element={<Logs />} />} />
          <Route path={Routes.TUNE_DIAGNOSE} element={<ContentFor marginLeft={margin} bottomOffset element={<Diagnose />} />} />
          <Route path={Routes.TUNE_DIAGNOSE_FILE} element={<ContentFor marginLeft={margin} bottomOffset element={<Diagnose />} />} />
          <Route path={`${Routes.UPLOAD}/*`} element={<ContentFor element={<Upload />} />} />

          <Route path={Routes.LOGIN} element={<ContentFor element={<Login formRole={FormRoles.LOGIN} />} />} />
          <Route path={Routes.SIGN_UP} element={<ContentFor element={<Login formRole={FormRoles.SING_UP} />} />} />
          <Route path={Routes.PROFILE} element={<ContentFor element={<Profile />} />} />
          <Route path={Routes.RESET_PASSWORD} element={<ContentFor element={<ResetPassword />} />} />

          <Route path={Routes.EMAIL_VERIFICATION} element={<ContentFor element={<EmailVerification />} />} />
          <Route path={Routes.RESET_PASSWORD_CONFIRMATION} element={<ContentFor element={<ResetPasswordConfirmation />} />} />
          <Route path={Routes.OAUTH_CALLBACK} element={<ContentFor element={<OauthCallback />} />} />
        </ReactRoutes>
        <Result status="warning" title="Page not found" style={{ marginTop: 50 }} />
      </Layout>
      <StatusBar />
    </>
  );
};

export default connect(mapStateToProps)(App);
