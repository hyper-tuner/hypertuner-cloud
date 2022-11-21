import { Layout, Menu } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { connect } from 'react-redux';
import { generatePath, PathMatch, useNavigate } from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useCallback, useEffect, useState } from 'react';
import {
  Config as ConfigType,
  Menus as MenusType,
  Tune as TuneType,
  SubMenu as SubMenuType,
  GroupMenu as GroupMenuType,
  GroupChildMenu as GroupChildMenuType,
} from '@hyper-tuner/types';
import store from '../../store';
import Icon from '../SideBar/Icon';
import { Routes } from '../../routes';
import { AppState, NavigationState, UIState } from '../../types/state';

const { Sider } = Layout;

export const SKIP_MENUS = [
  // speeduino
  'help',
  'hardwareTesting',
  '3dTuningMaps',
  'dataLogging',
  'tools',

  // rusefi
  'view',
  'controller',
];

export const SKIP_SUB_MENUS = [
  'settings/gaugeLimits',
  'settings/io_summary',
  'tuning/std_realtime',
];

export const buildDialogUrl = (tuneId: string, main: string, dialog: string) =>
  generatePath(Routes.TUNE_DIALOG, {
    tuneId,
    category: main,
    dialog: dialog.replaceAll(' ', '-'),
  });

export const buildGroupMenuDialogUrl = (
  tuneId: string,
  main: string,
  groupMenu: string,
  dialog: string,
) =>
  generatePath(Routes.TUNE_GROUP_MENU_DIALOG, {
    tuneId,
    category: main,
    groupMenu: groupMenu.replaceAll(' ', '-'),
    dialog,
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
  matchedPath: PathMatch<'dialog' | 'tuneId' | 'category'> | null;
  matchedGroupMenuDialogPath: PathMatch<'dialog' | 'groupMenu' | 'tuneId' | 'category'> | null;
}

export const sidebarWidth = 250;
export const collapsedSidebarWidth = 50;

const SideBar = ({
  config,
  tune,
  ui,
  navigation,
  matchedPath,
  matchedGroupMenuDialogPath,
}: SideBarProps) => {
  const siderProps = {
    width: sidebarWidth,
    collapsedWidth: collapsedSidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) =>
      store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed }),
  } as any;
  const [menus, setMenus] = useState<ItemType[]>([]);
  const navigate = useNavigate();

  const mapSubMenuItems = useCallback(
    (
      rootMenuName: string,
      subMenus: {
        [name: string]: SubMenuType | GroupMenuType | GroupChildMenuType;
      },
      groupMenuName: string | null = null,
    ): ItemType[] => {
      const items: ItemType[] = [];

      Object.keys(subMenus).forEach((subMenuName: string) => {
        if (SKIP_SUB_MENUS.includes(`${rootMenuName}/${subMenuName}`)) {
          return;
        }

        if (subMenuName === 'std_separator') {
          items.push({
            type: 'divider',
          });

          return;
        }

        const subMenu = subMenus[subMenuName];

        if ((subMenu as GroupMenuType).type === 'groupMenu') {
          // recurrence
          items.push({
            key: buildDialogUrl(navigation.tuneId!, rootMenuName, (subMenu as GroupMenuType).title),
            icon: <Icon name={subMenuName} />,
            label: (subMenu as GroupMenuType).title,
            children: mapSubMenuItems(
              rootMenuName,
              (subMenu as GroupMenuType).groupChildMenus,
              (subMenu as GroupMenuType).title,
            ),
          });

          return;
        }

        const url = groupMenuName
          ? buildGroupMenuDialogUrl(navigation.tuneId!, rootMenuName, groupMenuName, subMenuName)
          : buildDialogUrl(navigation.tuneId!, rootMenuName, subMenuName);

        items.push({
          key: url,
          icon: <Icon name={subMenuName} />,
          label: subMenu.title,
          onClick: () => navigate(url),
        });
      });

      return items;
    },
    [navigate, navigation.tuneId],
  );

  const menusList = useCallback(
    (menusObject: MenusType): ItemType[] =>
      Object.keys(menusObject).map((menuName: string) => {
        if (SKIP_MENUS.includes(menuName)) {
          return null;
        }

        const subMenuItems: ItemType[] = mapSubMenuItems(menuName, menusObject[menuName].subMenus);

        return {
          key: `/${menuName}`,
          icon: <Icon name={menuName} />,
          label: menusObject[menuName].title,
          children: subMenuItems,
        };
      }),
    [mapSubMenuItems],
  );

  useEffect(() => {
    if (tune && config && Object.keys(tune.constants).length) {
      setMenus(menusList(config.menus));
    }
  }, [config, config?.menus, menusList, tune, tune?.constants]);

  const defaultOpenSubmenus = () => {
    if (matchedGroupMenuDialogPath) {
      return [
        `/${matchedGroupMenuDialogPath.params.category}`,
        buildDialogUrl(
          navigation.tuneId!,
          matchedGroupMenuDialogPath.params.category!,
          matchedGroupMenuDialogPath.params.groupMenu!,
        ),
      ];
    }

    return [`/${matchedPath!.params.category}`];
  };

  return (
    <Sider {...siderProps} className="app-sidebar">
      <PerfectScrollbar options={{ suppressScrollX: true }}>
        <Menu
          defaultSelectedKeys={[
            matchedGroupMenuDialogPath
              ? matchedGroupMenuDialogPath.pathname
              : matchedPath!.pathname,
          ]}
          defaultOpenKeys={ui.sidebarCollapsed ? [] : defaultOpenSubmenus()}
          mode="inline"
          style={{ height: '100%' }}
          key={
            matchedGroupMenuDialogPath ? matchedGroupMenuDialogPath.pathname : matchedPath!.pathname
          }
          items={menus}
        />
      </PerfectScrollbar>
    </Sider>
  );
};

export default connect(mapStateToProps)(SideBar);
