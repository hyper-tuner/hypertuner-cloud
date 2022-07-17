import {
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { useEffect } from 'react';
import { Config as ConfigType } from '@hyper-tuner/types';
import Dialog from '../components/Tune/Dialog';
import SideBar from '../components/Tune/SideBar';
import { Routes } from '../routes';
import useConfig from '../hooks/useConfig';
import {
  AppState,
  TuneState,
} from '../types/state';
import Loader from '../components/Loader';

const mapStateToProps = (state: AppState) => ({
  navigation: state.navigation,
  status: state.status,
  config: state.config,
  tune: state.tune,
});

const Tune = ({ config, tune }: { config: ConfigType | null, tune: TuneState }) => {
  const dialogMatch = useMatch(Routes.TUNE_DIALOG);
  const tuneRootMatch = useMatch(Routes.TUNE_TUNE);
  // const { storageGetSync } = useBrowserStorage();
  // const lastDialogPath = storageGetSync('lastDialog');
  const { isConfigReady } = useConfig(config);
  const navigate = useNavigate();

  const tunePathMatch = useMatch(`${Routes.TUNE_ROOT}/*`);
  const tuneId = tunePathMatch?.params.tuneId;

  useEffect(() => {
    if (tune && config && tuneRootMatch) {
      const firstCategory = Object.keys(config!.menus)[0];
      const firstDialog = Object.keys(config!.menus[firstCategory].subMenus)[0];

      const firstDialogPath = generatePath(Routes.TUNE_DIALOG, {
        tuneId,
        category: firstCategory,
        dialog: firstDialog,
      });

      navigate(firstDialogPath, { replace: true });
    }
  }, [navigate, tuneRootMatch, isConfigReady, config?.menus, tuneId, config, tune, dialogMatch]);

  if (!tune || !config || !dialogMatch) {
    return <Loader />;
  }

  return (
    <>
      <SideBar matchedPath={dialogMatch!} />
      <Dialog
        name={dialogMatch?.params.dialog!}
        url={dialogMatch?.pathname || ''}
      />
    </>
  );
};

export default connect(mapStateToProps)(Tune);
