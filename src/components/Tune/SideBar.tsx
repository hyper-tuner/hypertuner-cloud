import {
  Layout,
  Menu,
} from 'antd';
import { connect } from 'react-redux';
import {
  generatePath,
  Link,
  PathMatch,
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
import {
  AppState,
  NavigationState,
  UIState,
} from '../../types/state';

const { Sider } = Layout;
const { SubMenu } = Menu;

export const SKIP_MENUS = [
  'help',
  'hardwareTesting',
  '3dTuningMaps',
  'dataLogging',
  'tools',
];

export const SKIP_SUB_MENUS = [
  'settings/gaugeLimits',
  'settings/io_summary',
  'tuning/std_realtime',
];

export const buildUrl = (tuneId: string, main: string, sub: string) => generatePath(Routes.TUNE_DIALOG, {
  tuneId,
  category: main,
  dialog: sub,
});

const mapStateToProps = (state: AppState) => ({
  config: state.config,
  tune: state.tune,
  ui: state.ui,
  navigation: state.navigation,
});

interface SideBarProps {
  config: ConfigType;
  tune: TuneType;
  ui: UIState;
  navigation: NavigationState;
  matchedPath: PathMatch<'dialog' | 'tuneId' | 'category'>;
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
              return <Menu.Divider key={buildUrl(navigation.tuneId!, menuName, subMenuName)} />;
            }

            if (SKIP_SUB_MENUS.includes(`${menuName}/${subMenuName}`)) {
              return null;
            }
            const subMenu = types[menuName].subMenus[subMenuName];

            return (<Menu.Item
              key={buildUrl(navigation.tuneId!, menuName, subMenuName)}
              icon={<Icon name={subMenuName} />}
            >
              <Link to={buildUrl(navigation.tuneId!, menuName, subMenuName)}>
                {subMenu.title}
              </Link>
            </Menu.Item>);
          })}
        </SubMenu>
      );
    })
  ), [navigation.tuneId]);

  useEffect(() => {
    if (Object.keys(tune.constants).length) {
      setMenus(menusList(config.menus));
    }
  }, [config.menus, menusList, tune.constants]);

  return (
    <Sider {...siderProps} className="app-sidebar">
      <PerfectScrollbar options={{ suppressScrollX: true }}>
        <Menu
          defaultSelectedKeys={[matchedPath.pathname]}
          defaultOpenKeys={ui.sidebarCollapsed ? [] : [`/${matchedPath.params.category}`]}
          mode="inline"
          style={{ height: '100%' }}
          key={matchedPath.pathname}
        >
          {menus}
        </Menu>
      </PerfectScrollbar>
    </Sider>
  );
};

export default connect(mapStateToProps)(SideBar);
