import {
  CarOutlined,
  CloudUploadOutlined,
  FundOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Config as ConfigType,
  GroupChildMenu as GroupChildMenuType,
  GroupMenu as GroupMenuType,
  Menu as MenuType,
  Menus as MenusType,
  SubMenu as SubMenuType,
  Tune as TuneType,
} from '@hyper-tuner/types';
import {
  Action,
  ActionId,
  ActionImpl,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useMatches,
  useRegisterActions,
} from 'kbar';
import { CSSProperties, Fragment, ReactNode, Ref, forwardRef, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { generatePath, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { logOutSuccessful } from '../pages/auth/notifications';
import { Routes } from '../routes';
import store from '../store';
import { AppState, NavigationState } from '../types/state';
import { isMac } from '../utils/env';
import Icon from './SideBar/Icon';
import {
  SKIP_MENUS,
  SKIP_SUB_MENUS,
  buildDialogUrl,
  buildGroupMenuDialogUrl,
} from './Tune/SideBar';

enum Sections {
  NAVIGATION = 'Navigation',
  AUTH = 'Authentication',
  TUNE = 'Tune',
  LOG = 'Log',
  DIAGNOSE = 'Diagnose',
}

const mapStateToProps = (state: AppState) => ({
  config: state.config,
  tune: state.tune,
  ui: state.ui,
  navigation: state.navigation,
});

interface CommandPaletteProps {
  config: ConfigType | null;
  tune: TuneType | null;
  navigation: NavigationState;
  children?: ReactNode;
}

const searchStyle = {
  padding: '12px 16px',
  fontSize: '16px',
  width: '100%',
  boxSizing: 'border-box' as CSSProperties['boxSizing'],
  outline: 'none',
  border: 'none',
  background: 'var(--background)',
  color: 'var(--foreground)',
};

const animatorStyle = {
  maxWidth: '600px',
  width: '100%',
  background: 'var(--background)',
  color: 'var(--foreground)',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: 'var(--shadow)',
};

const groupNameStyle = {
  padding: '8px 16px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  opacity: 0.5,
};

// eslint-disable-next-line react/display-name
const ResultItem = forwardRef(
  (
    {
      action,
      active,
      currentRootActionId,
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
    },
    ref: Ref<HTMLDivElement>,
  ) => {
    const ancestors = useMemo(() => {
      if (!currentRootActionId) {
        return action.ancestors;
      }
      const index = action.ancestors.findIndex((ancestor) => ancestor.id === currentRootActionId);
      // +1 removes the currentRootAction (currently active item)
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    return (
      <div
        ref={ref}
        style={{
          padding: '12px 16px',
          background: active ? 'var(--a1)' : 'transparent',
          borderLeft: `2px solid ${active ? 'var(--foreground)' : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: 14,
          }}
        >
          {action.icon && action.icon}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <Fragment key={ancestor.id}>
                    <span
                      style={{
                        opacity: 0.5,
                        marginRight: 8,
                      }}
                    >
                      {ancestor.name}
                    </span>
                    <span style={{ marginRight: 8 }}>&rsaquo;</span>
                  </Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && <span style={{ fontSize: 12 }}>{action.subtitle}</span>}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div aria-hidden style={{ display: 'grid', gridAutoFlow: 'column', gap: '4px' }}>
            {action.shortcut.map((sc) => (
              <kbd
                key={sc}
                style={{
                  padding: '4px 6px',
                  background: 'rgba(0 0 0 / .1)',
                  borderRadius: '4px',
                  fontSize: 14,
                }}
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);

const RenderResults = () => {
  const { results, rootActionId } = useMatches();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onResultsRender = ({ item, active }: { item: any; active: boolean }) => {
    return typeof item === 'string' ? (
      <div style={groupNameStyle}>{item}</div>
    ) : (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      <ResultItem action={item} active={active} currentRootActionId={rootActionId!} />
    );
  };

  return <KBarResults items={results} onRender={onResultsRender} />;
};

const buildTuneUrl = (tuneId: string, route: string) => generatePath(route, { tuneId });

const ActionsProvider = (props: CommandPaletteProps) => {
  const { config, tune, navigation } = props;
  const navigate = useNavigate();

  const generateActions = useCallback(
    (types: MenusType) => {
      const newActions: Action[] = [
        {
          id: 'InfoAction',
          section: Sections.TUNE,
          name: 'Info',
          subtitle: 'Basic information about this tune.',
          icon: <InfoCircleOutlined />,
          perform: () => {
            navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_ROOT));
          },
        },
        {
          id: 'LogsAction',
          section: Sections.LOG,
          name: 'Logs',
          subtitle: 'Log viewer.',
          icon: <FundOutlined />,
          perform: () => {
            navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_LOGS));
          },
        },
        {
          id: 'DiagnoseAction',
          section: Sections.DIAGNOSE,
          name: 'Diagnose',
          subtitle: 'Tooth and composite logs viewer.',
          icon: <SettingOutlined />,
          perform: () => {
            navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_DIAGNOSE));
          },
        },
      ];

      const mapSubMenuItems = (
        rootMenuName: string,
        rootMenu: MenuType,
        subMenus: Record<string, SubMenuType | GroupMenuType | GroupChildMenuType>,
        groupMenuName: string | null = null,
      ) => {
        Object.keys(subMenus).forEach((subMenuName: string) => {
          if (SKIP_SUB_MENUS.includes(`${rootMenuName}/${subMenuName}`)) {
            return;
          }

          if (subMenuName === 'std_separator') {
            return;
          }

          const subMenu = subMenus[subMenuName];

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if ((subMenu as GroupMenuType).type === 'groupMenu') {
            // recurrence
            mapSubMenuItems(
              rootMenuName,
              rootMenu,
              (subMenu as GroupMenuType).groupChildMenus,
              (subMenu as GroupMenuType).title,
            );

            return;
          }

          const url = groupMenuName
            ? buildGroupMenuDialogUrl(navigation.tuneId!, rootMenuName, groupMenuName, subMenuName)
            : buildDialogUrl(navigation.tuneId!, rootMenuName, subMenuName);

          newActions.push({
            id: url,
            section: rootMenu.title,
            name: subMenu.title,
            icon: <Icon name={subMenuName} />,
            perform: () => {
              navigate(url);
            },
          });
        });
      };

      Object.keys(types).forEach((rootMenuName: string) => {
        if (SKIP_MENUS.includes(rootMenuName)) {
          return;
        }

        mapSubMenuItems(rootMenuName, types[rootMenuName], types[rootMenuName].subMenus);
      });

      return newActions;
    },
    [navigate, navigation.tuneId],
  );

  const getActions = () => {
    if (tune?.constants && Object.keys(tune.constants).length) {
      return generateActions(config!.menus);
    }

    return [];
  };

  useRegisterActions(getActions(), [tune?.constants]);

  return null;
};

const CommandPalette = (props: CommandPaletteProps) => {
  const { children, config, tune, navigation } = props;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const logoutAction = useCallback(() => {
    logout();
    logOutSuccessful();
    navigate(Routes.HUB);
  }, [logout, navigate]);

  const initialActions = [
    {
      id: 'HubAction',
      section: Sections.NAVIGATION,
      name: 'Hub',
      subtitle: 'Public tunes and logs.',
      icon: <CarOutlined />,
      perform: () => {
        navigate(Routes.HUB);
      },
    },
    {
      id: 'ToggleSidebar',
      name: 'Toggle Sidebar',
      shortcut: [isMac ? '⌘' : 'ctrl', '\\'],
      perform: () => store.dispatch({ type: 'ui/toggleSidebar' }),
    },
    {
      id: 'UploadAction',
      section: Sections.NAVIGATION,
      name: 'Upload',
      subtitle: 'Upload tune and logs.',
      icon: <CloudUploadOutlined />,
      perform: () => {
        navigate(Routes.UPLOAD);
      },
    },
    {
      id: 'LoginAction',
      section: Sections.AUTH,
      name: 'Login',
      subtitle: 'Login using email, Google or GitHub account.',
      icon: <LoginOutlined />,
      perform: () => {
        navigate(Routes.LOGIN);
      },
    },
    {
      id: 'SignUpAction',
      section: Sections.AUTH,
      name: 'Sign-up',
      subtitle: 'Create new account.',
      icon: <UserAddOutlined />,
      perform: () => {
        navigate(Routes.SIGN_UP);
      },
    },
    {
      id: 'LogoutAction',
      section: Sections.AUTH,
      name: 'Logout',
      subtitle: 'Logout current user.',
      icon: <LogoutOutlined />,
      perform: logoutAction,
    },
    {
      id: 'AboutAction',
      name: 'About',
      subtitle: 'About this app / sponsor.',
      icon: <InfoCircleOutlined />,
      perform: () => {
        navigate(Routes.ABOUT);
      },
    },
  ];

  return (
    <KBarProvider actions={initialActions}>
      <KBarPortal>
        <KBarPositioner style={{ zIndex: 1, backdropFilter: 'blur(3px)' }}>
          <KBarAnimator style={animatorStyle}>
            <KBarSearch style={searchStyle} />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      <ActionsProvider config={config} tune={tune} navigation={navigation} />
      {children}
    </KBarProvider>
  );
};

export default connect(mapStateToProps)(CommandPalette);
