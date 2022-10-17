import {
  CSSProperties,
  forwardRef,
  Fragment,
  Ref,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import {
  ActionId,
  KBarAnimator,
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  KBarResults,
  useMatches,
  ActionImpl,
  Action,
  useRegisterActions,
} from 'kbar';
import { connect } from 'react-redux';
import {
  CloudUploadOutlined,
  LoginOutlined,
  UserAddOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  FundOutlined,
  SettingOutlined,
  CarOutlined,
} from '@ant-design/icons';
import {
  useNavigate,
  generatePath,
} from 'react-router';
import {
  Config as ConfigType,
  Tune as TuneType,
  Menus as MenusType,
  Menu as MenuType,
  SubMenu as SubMenuType,
  GroupMenu as GroupMenuType,
  GroupChildMenu as GroupChildMenuType,
} from '@hyper-tuner/types';
import { Routes } from '../routes';
import { useAuth } from '../contexts/AuthContext';
import { logOutSuccessful } from '../pages/auth/notifications';
import store from '../store';
import { isMac } from '../utils/env';
import {
  AppState,
  NavigationState,
} from '../types/state';
import {
  buildUrl,
  SKIP_MENUS,
  SKIP_SUB_MENUS,
} from './Tune/SideBar';
import Icon from './SideBar/Icon';

enum Sections {
  NAVIGATION = 'Navigation',
  AUTH = 'Authentication',
  TUNE = 'Tune',
  LOG = 'Log',
  DIAGNOSE = 'Diagnose',
};

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
  // eslint-disable-next-line react/no-unused-prop-types
  children?: ReactNode;
};

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
      if (!currentRootActionId) return action.ancestors;
      const index = action.ancestors.findIndex(
        (ancestor) => ancestor.id === currentRootActionId,
      );
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
                ancestors.map((ancestor: any) => (
                  <Fragment key={ancestor.id}>
                    <span
                      style={{
                        opacity: 0.5,
                        marginRight: 8,
                      }}
                    >
                      {ancestor.name}
                    </span>
                    <span style={{ marginRight: 8 }}>
                      &rsaquo;
                    </span>
                  </Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span style={{ fontSize: 12 }}>{action.subtitle}</span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div
            aria-hidden
            style={{ display: 'grid', gridAutoFlow: 'column', gap: '4px' }}
          >
            {action.shortcut.map((sc: any) => (
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

  const onResultsRender = ({ item, active }: { item: any, active: any }) =>
    typeof item === 'string' ? (
      <div style={groupNameStyle}>{item}</div>
    ) : (
      <ResultItem
        action={item}
        active={active}
        currentRootActionId={rootActionId as string}
      />
    );

  return (
    <KBarResults
      items={results}
      onRender={onResultsRender}
    />
  );
};

const buildTuneUrl = (tuneId: string, route: string) => generatePath(route, { tuneId });

const ActionsProvider = (props: CommandPaletteProps) => {
  const { config, tune, navigation } = props;
  const navigate = useNavigate();

  const generateActions = useCallback((types: MenusType) => {
    const newActions: Action[] = [
      {
        id: 'InfoAction',
        section: Sections.TUNE,
        name: 'Info',
        subtitle: 'Basic information about this tune.',
        icon: <InfoCircleOutlined />,
        perform: () => navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_ROOT)),
      },
      {
        id: 'LogsAction',
        section: Sections.LOG,
        name: 'Logs',
        subtitle: 'Log viewer.',
        icon: <FundOutlined />,
        perform: () => navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_LOGS)),
      },
      {
        id: 'DiagnoseAction',
        section: Sections.DIAGNOSE,
        name: 'Diagnose',
        subtitle: 'Tooth and composite logs viewer.',
        icon: <SettingOutlined />,
        perform: () => navigate(buildTuneUrl(navigation.tuneId!, Routes.TUNE_DIAGNOSE)),
      },
    ];

    const mapSubMenuItems = (rootMenuName: string, rootMenu: MenuType, subMenus: { [name: string]: SubMenuType | GroupMenuType | GroupChildMenuType }) => {
      Object
        .keys(subMenus)
        .forEach((subMenuName: string) => {
          if (SKIP_SUB_MENUS.includes(`${rootMenuName}/${subMenuName}`)) {
            return;
          }

          if (subMenuName === 'std_separator') {
            return;
          }

          const subMenu = subMenus[subMenuName];

          if ((subMenu as GroupMenuType).type === 'groupMenu') {
            mapSubMenuItems(rootMenuName, rootMenu, (subMenu as GroupMenuType).groupChildMenus);

            return;
          }

          newActions.push({
            id: buildUrl(navigation.tuneId!, rootMenuName, subMenuName),
            section: rootMenu.title,
            name: subMenu.title,
            icon: <Icon name={subMenuName} />,
            perform: () => navigate(buildUrl(navigation.tuneId!, rootMenuName, subMenuName)),
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
  }, [navigate, navigation.tuneId]);

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
      perform: () => navigate(Routes.HUB),
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
      perform: () => navigate(Routes.UPLOAD),
    },
    {
      id: 'LoginAction',
      section: Sections.AUTH,
      name: 'Login',
      subtitle: 'Login using email, Google or GitHub account.',
      icon: <LoginOutlined />,
      perform: () => navigate(Routes.LOGIN),
    },
    {
      id: 'SignUpAction',
      section: Sections.AUTH,
      name: 'Sign-up',
      subtitle: 'Create new account.',
      icon: <UserAddOutlined />,
      perform: () => navigate(Routes.SIGN_UP),
    },
    {
      id: 'LogoutAction',
      section: Sections.AUTH,
      name: 'Logout',
      subtitle: 'Logout current user.',
      icon: <LogoutOutlined />,
      perform: logoutAction,
    },
  ];

  return (
    <KBarProvider actions={initialActions}>
      <KBarPortal>
        <KBarPositioner>
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
