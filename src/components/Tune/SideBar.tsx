import {
  Layout,
  Menu,
  Skeleton,
} from 'antd';
import { connect } from 'react-redux';
import {
  generatePath,
  Link,
} from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Config as ConfigType,
  Menus as MenusType,
  Tune as TuneType,
} from '@speedy-tuner/types';
import store from '../../store';
import Icon from '../SideBar/Icon';
import { Routes } from '../../routes';
import useConfig from '../../hooks/useConfig';
import {
  AppState,
  NavigationState,
  UIState,
} from '../../types/state';

const { Sider } = Layout;
const { SubMenu } = Menu;

export interface DialogMatchedPathType {
  url: string;
  params: {
    category: string;
    dialog: string;
  };
}

const mapStateToProps = (state: AppState) => ({
  config: state.config,
  tune: state.tune,
  ui: state.ui,
  navigation: state.navigation,
});

const SKIP_MENUS = [
  'help',
  'hardwareTesting',
  '3dTuningMaps',
  'dataLogging',
  'tools',
];

const SKIP_SUB_MENUS = [
  'settings/gaugeLimits',
  'settings/io_summary',
  'tuning/std_realtime',
];

interface SideBarProps {
  config: ConfigType;
  tune: TuneType;
  ui: UIState;
  navigation: NavigationState;
  matchedPath: DialogMatchedPathType;
};

const SideBar = ({ config, tune, ui, navigation, matchedPath }: SideBarProps) => {
  const sidebarWidth = 250;
  const siderProps = {
    width: sidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) => store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed }),
  } as any;
  const { isConfigReady } = useConfig(config);
  const buildUrl = useCallback((main: string, sub: string) => generatePath(Routes.TUNE_DIALOG, {
    tuneId: navigation.tuneId!,
    category: main,
    dialog: sub,
  }), [navigation.tuneId]);
  const [menus, setMenus] = useState<any[]>([]);

  const menusList = useCallback((types: MenusType) => (
    Object.keys(types).map((menuName: string) => {
      if (SKIP_MENUS.includes(menuName)) {
        return null;
      }

      return (
        <SubMenu
          key={`/${menuName}`}
          icon={<Icon name={menuName} />}
          title={types[menuName].title}
          onTitleClick={() => store.dispatch({ type: 'ui/sidebarCollapsed', payload: false })}
        >
          {Object.keys(types[menuName].subMenus).map((subMenuName: string) => {
            if (subMenuName === 'std_separator') {
              return <Menu.Divider key={buildUrl(menuName, subMenuName)} />;
            }

            if (SKIP_SUB_MENUS.includes(`${menuName}/${subMenuName}`)) {
              return null;
            }
            const subMenu = types[menuName].subMenus[subMenuName];

            return (<Menu.Item
              key={buildUrl(menuName, subMenuName)}
              icon={<Icon name={subMenuName} />}
            >
              <Link to={buildUrl(menuName, subMenuName)}>
                {subMenu.title}
              </Link>
            </Menu.Item>);
          })}
        </SubMenu>
      );
    })
  ), [buildUrl]);

  useEffect(() => {
    if (Object.keys(tune.constants).length) {
      setMenus(menusList(config.menus));
    }
  }, [config.menus, menusList, tune.constants]);

  if (!isConfigReady) {
    return (
      <Sider {...siderProps} className="app-sidebar" >
        <div style={{ paddingLeft: 10 }}>
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
        </div>
      </Sider>
    );
  }

  return (
    <Sider {...siderProps} className="app-sidebar">
      <PerfectScrollbar options={{ suppressScrollX: true }}>
        <Menu
          defaultSelectedKeys={[matchedPath.url]}
          defaultOpenKeys={ui.sidebarCollapsed ? [] : [`/${matchedPath.params.category}`]}
          mode="inline"
          style={{ height: '100%' }}
          key={matchedPath.url}
        >
          {menus}
        </Menu>
      </PerfectScrollbar>
    </Sider>
  );
};

export default connect(mapStateToProps)(SideBar);
