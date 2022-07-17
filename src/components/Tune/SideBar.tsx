import {
  Layout,
  Menu,
} from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { connect } from 'react-redux';
import {
  generatePath,
  PathMatch,
  useNavigate,
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
} from '@hyper-tuner/types';
import store from '../../store';
import Icon from '../SideBar/Icon';
import { Routes } from '../../routes';
import {
  AppState,
  NavigationState,
  UIState,
} from '../../types/state';

const { Sider } = Layout;

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
  config: ConfigType | null;
  tune: TuneType | null;
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
  const [menus, setMenus] = useState<ItemType[]>([]);
  const navigate = useNavigate();

  const menusList = useCallback((types: MenusType): ItemType[] => (
    Object.keys(types).map((menuName: string) => {
      if (SKIP_MENUS.includes(menuName)) {
        return null;
      }

      const subMenuItems: ItemType[] = Object.keys(types[menuName].subMenus).map((subMenuName: string) => {
        if (subMenuName === 'std_separator') {
          return { type: 'divider' };
        }

        if (SKIP_SUB_MENUS.includes(`${menuName}/${subMenuName}`)) {
          return null;
        }

        const subMenu = types[menuName].subMenus[subMenuName];

        return {
          key: buildUrl(navigation.tuneId!, menuName, subMenuName),
          icon: <Icon name={subMenuName} />,
          label: subMenu.title,
          onClick: () => navigate(buildUrl(navigation.tuneId!, menuName, subMenuName)),
        };
      });

      return {
        key: `/${menuName}`,
        icon: <Icon name={menuName} />,
        label: types[menuName].title,
        onClick: () => ui.sidebarCollapsed && store.dispatch({ type: 'ui/sidebarCollapsed', payload: false }),
        children: subMenuItems,
      };
    })
  ), [navigate, navigation.tuneId, ui.sidebarCollapsed]);

  useEffect(() => {
    if (tune && config && Object.keys(tune.constants).length) {
      setMenus(menusList(config.menus));
    }
  }, [config, config?.menus, menusList, tune, tune?.constants]);

  return (
    <Sider {...siderProps} className="app-sidebar">
      <PerfectScrollbar options={{ suppressScrollX: true }}>
        <Menu
          defaultSelectedKeys={[matchedPath.pathname]}
          defaultOpenKeys={ui.sidebarCollapsed ? [] : [`/${matchedPath.params.category}`]}
          mode="inline"
          style={{ height: '100%' }}
          key={matchedPath.pathname}
          items={menus}
        />
      </PerfectScrollbar>
    </Sider>
  );
};

export default connect(mapStateToProps)(SideBar);
