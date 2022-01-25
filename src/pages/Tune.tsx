import { Skeleton } from 'antd';
import {
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import { connect } from 'react-redux';
import {
  useEffect,
  useMemo,
} from 'react';
import { Config as ConfigType } from '@speedy-tuner/types';
import Dialog from '../components/Tune/Dialog';
import SideBar from '../components/Tune/SideBar';
import { Routes } from '../routes';
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
  const dialogMatch = useMatch(Routes.TUNE_DIALOG);
  const tuneRootMatch = useMatch(Routes.TUNE_TUNE);
  // const { storageGetSync } = useBrowserStorage();
  // const lastDialogPath = storageGetSync('lastDialog');
  const { isConfigReady } = useConfig(config);
  const navigate = useNavigate();

  const firstDialogPath = useMemo(() => {
    if (!isConfigReady) {
      return null;
    }

    const firstCategory = Object.keys(config.menus)[0];
    const firstDialog = Object.keys(config.menus[firstCategory].subMenus)[0];

    return generatePath(Routes.TUNE_DIALOG, {
      tuneId: navigation.tuneId!,
      category: firstCategory,
      dialog: firstDialog,
    });
  }, [config.menus, isConfigReady, navigation.tuneId]);

  useEffect(() => {
    if (tuneRootMatch && firstDialogPath) {
      navigate(firstDialogPath, { replace: true });
    }
  }, [firstDialogPath, navigate, tuneRootMatch, isConfigReady]);

  // TODO: unify loading indicators across the app
  if (!isConfigReady || !dialogMatch) {
    return (
      <div>
        <Skeleton active />
      </div>
    );
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
