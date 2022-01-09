import {
  useLocation,
  Route,
  matchPath,
  Redirect,
  generatePath,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { useMemo } from 'react';
import { Config as ConfigType } from '@speedy-tuner/types';
import Dialog from '../components/Tune/Dialog';
import SideBar, { DialogMatchedPathType } from '../components/SideBar';
import { Routes } from '../routes';
import useStorage from '../hooks/useStorage';
import useConfig from '../hooks/useConfig';
import {
  AppState,
  NavigationState,
} from '../types/state';

const mapStateToProps = (state: AppState) => ({
  navigation: state.navigation,
  status: state.status,
  config: state.config,
});

const Tune = ({ navigation, config }: { navigation: NavigationState, config: ConfigType }) => {
  const { pathname } = useLocation();
  const { storageGetSync } = useStorage();
  const lastDialogPath = storageGetSync('lastDialog');
  const { isConfigReady } = useConfig(config);
  const dialogMatchedPath: DialogMatchedPathType = useMemo(() => matchPath(pathname, {
    path: Routes.TUNE_DIALOG,
    exact: true,
  }) || { url: '', params: { category: '', dialog: '' } }, [pathname]);

  const firstDialogPath = useMemo(() => {
    if (!isConfigReady) {
      return null;
    }

    const firstCategory = Object.keys(config.menus)[0];
    const firstDialog = Object.keys(config.menus[firstCategory].subMenus)[0];
    return generatePath(Routes.TUNE_DIALOG, {
      tuneId: navigation.tuneId || 'not-ready',
      category: firstCategory,
      dialog: firstDialog,
    });
  }, [config.menus, isConfigReady, navigation.tuneId]);

  return (
    <>
      <Route path={Routes.TUNE_TUNE} exact>
        {firstDialogPath && <Redirect to={lastDialogPath || firstDialogPath} />}
      </Route>
      <SideBar matchedPath={dialogMatchedPath} />
      <Dialog
        name={dialogMatchedPath.params.dialog}
        url={dialogMatchedPath.url}
      />
    </>
  );
};

export default connect(mapStateToProps)(Tune);
