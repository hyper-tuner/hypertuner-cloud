import { INI } from '@hyper-tuner/ini';
import { Layout, Modal, Result } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ReactNode, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Route,
  Routes as ReactRoutes,
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import Loader from './components/Loader';
import StatusBar from './components/StatusBar';
import TopBar from './components/TopBar';
import { collapsedSidebarWidth, sidebarWidth } from './components/Tune/SideBar';
import { divider } from './data/constants';
import help from './data/help';
import standardDialogs from './data/standardDialogs';
import useDb from './hooks/useDb';
import useServerStorage from './hooks/useServerStorage';
import Hub from './pages/Hub';
import Info from './pages/Info';
import { FormRoles } from './pages/auth/Login';
import { iniLoadingError, tuneNotFound, tuneParsingError } from './pages/auth/notifications';
import { Routes } from './routes';
import store from './store';
import { AppState, TuneDataState, UIState } from './types/state';
import TuneParser from './utils/tune/TuneParser';

import 'react-perfect-scrollbar/dist/css/styles.css';
import 'uplot/dist/uPlot.min.css';
import { TunesResponse } from './@types/pocketbase-types';
import './css/App.less';
import { useUpdateCheck } from 'react-update-notification';

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
const About = lazy(() => import('./pages/About'));
const User = lazy(() => import('./pages/User'));

const { Content } = Layout;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  tuneData: state.tuneData,
});

const NewVersionPrompt = () => {
  // fetch /version.json?v=timestamp every 10s
  const { status, reloadPage } = useUpdateCheck({
    type: 'interval',
    interval: 10000,
    ignoreServerCache: true,
  });
  const [open, setOpen] = useState(true);

  if (status === 'checking' || status === 'current') {
    return null;
  }

  return (
    <Modal
      title="New Version Available! 🚀"
      open={open}
      centered
      maskClosable={false}
      closable={false}
      keyboard={false}
      onOk={reloadPage}
      okText="Reload the page"
      okButtonProps={{ icon: <ReloadOutlined /> }}
      onCancel={() => setOpen(false)}
      cancelText="I'll do it later"
      cancelButtonProps={{ icon: <ClockCircleOutlined /> }}
      destroyOnClose
    >
      <p>To enjoy the new features, it's time to refresh the page!</p>
      <p>You can refresh later at your convenience.</p>
    </Modal>
  );
};

const App = ({ ui, tuneData }: { ui: UIState; tuneData: TuneDataState }) => {
  const margin = ui.sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth;
  const { getTune } = useDb();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const tunePathMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneId = tunePathMatch?.params.tuneId;
  const { fetchINIFile, fetchTuneFile } = useServerStorage();

  const loadTune = async (data: TunesResponse | null) => {
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
      const iniRaw = data.customIniFile
        ? fetchTuneFile(data.id, data.customIniFile)
        : fetchINIFile(data.signature);
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
      iniLoadingError(error as Error);
      navigate(
        generatePath(Routes.TUNE_ROOT, {
          tuneId: tuneId!,
        }),
      );
    }
  };

  useEffect(() => {
    // Handle external redirects (oauth, etc)
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPage = searchParams.get('redirect');
    switch (redirectPage) {
      case Routes.REDIRECT_PAGE_OAUTH_CALLBACK: {
        window.location.href = `/#${generatePath(Routes.OAUTH_CALLBACK, {
          provider: searchParams.get('provider')!,
        })}?${searchParams.toString()}`;
        break;
      }
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
          tuneNotFound();
          navigate(Routes.HUB);
          return;
        }

        loadTune(tune!);
        store.dispatch({
          type: 'tuneData/load',
          payload: JSON.parse(JSON.stringify(tune)),
        });
      });

      store.dispatch({ type: 'navigation/tuneId', payload: tuneId });
    }
  }, [tuneId]);

  const ContentFor = useCallback((props: { element: ReactNode; marginLeft?: number }) => {
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
      <NewVersionPrompt />
      <Layout>
        <TopBar tuneData={tuneData} />
        <ReactRoutes>
          <Route path={Routes.HUB} element={<ContentFor element={<Hub />} />} />
          <Route path={Routes.TUNE_ROOT} element={<ContentFor element={<Info />} />} />
          <Route
            path={`${Routes.TUNE_TUNE}/*`}
            element={<ContentFor marginLeft={margin} element={<Tune />} />}
          />
          <Route
            path={Routes.TUNE_LOGS}
            element={<ContentFor marginLeft={margin} element={<Logs />} />}
          />
          <Route
            path={Routes.TUNE_LOGS_FILE}
            element={<ContentFor marginLeft={margin} element={<Logs />} />}
          />
          <Route
            path={Routes.TUNE_DIAGNOSE}
            element={<ContentFor marginLeft={margin} element={<Diagnose />} />}
          />
          <Route
            path={Routes.TUNE_DIAGNOSE_FILE}
            element={<ContentFor marginLeft={margin} element={<Diagnose />} />}
          />
          <Route path={`${Routes.UPLOAD}/*`} element={<ContentFor element={<Upload />} />} />

          <Route
            path={Routes.LOGIN}
            element={<ContentFor element={<Login formRole={FormRoles.LOGIN} />} />}
          />
          <Route
            path={Routes.SIGN_UP}
            element={<ContentFor element={<Login formRole={FormRoles.SING_UP} />} />}
          />
          <Route path={Routes.PROFILE} element={<ContentFor element={<Profile />} />} />
          <Route
            path={Routes.RESET_PASSWORD}
            element={<ContentFor element={<ResetPassword />} />}
          />
          <Route path={Routes.ABOUT} element={<ContentFor element={<About />} />} />
          <Route path={Routes.USER_ROOT} element={<ContentFor element={<User />} />} />

          <Route
            path={Routes.EMAIL_VERIFICATION}
            element={<ContentFor element={<EmailVerification />} />}
          />
          <Route
            path={Routes.RESET_PASSWORD_CONFIRMATION}
            element={<ContentFor element={<ResetPasswordConfirmation />} />}
          />
          <Route
            path={Routes.OAUTH_CALLBACK}
            element={<ContentFor element={<OauthCallback />} />}
          />

          <Route
            path="*"
            element={
              <ContentFor
                element={
                  <Result status="warning" title="Page not found" style={{ marginTop: 50 }} />
                }
              />
            }
          />
        </ReactRoutes>
      </Layout>
      <StatusBar />
    </>
  );
};

export default connect(mapStateToProps)(App);
