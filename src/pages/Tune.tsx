import {
  useLocation,
  Route,
  matchPath,
  Redirect,
  generatePath,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { useMemo } from 'react';
import {
  AppState,
  UIState,
  Config as ConfigType,
} from '@speedy-tuner/types';
import Dialog from '../components/Dialog';
import SideBar, { DialogMatchedPathType } from '../components/SideBar';
import { Routes } from '../routes';
import useStorage from '../hooks/useStorage';
import useConfig from '../hooks/useConfig';

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
});

const Tune = ({ ui, config }: { ui: UIState, config: ConfigType }) => {
  const { pathname } = useLocation();
  const { storageGetSync } = useStorage();
  const lastDialogPath = storageGetSync('lastDialog');
  const { isConfigReady } = useConfig(config);
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

  return (
    <>
      <Route path={Routes.TUNE} exact>
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
