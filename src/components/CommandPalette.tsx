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
} from 'kbar';
import {
  CloudUploadOutlined,
  LoginOutlined,
  UserAddOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router';
import { Routes } from '../routes';
import { useAuth } from '../contexts/AuthContext';
import {
  logOutFailed,
  logOutSuccessful,
} from '../pages/auth/notifications';
import store from '../store';
import { isMac } from '../utils/env';

enum Sections {
  NAVIGATION = 'Navigation',
  AUTH = 'Authentication',
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

const CommandPalette = (props: { children: ReactNode }) => {
  const { children } = props;
  const history = useHistory();
  const { logout } = useAuth();

  const logoutAction = useCallback(async() => {
    try {
      await logout();
      logOutSuccessful();
    } catch (error) {
      console.warn(error);
      logOutFailed(error as Error);
    }
  }, [logout]);

  const initialActions = useMemo(() => [
    {
      id: 'ToggleSidebar',
      name: 'Toggle Sidebar',
      shortcut: [isMac ? '⌘' : 'ctrl', '\\'],
      perform: () => store.dispatch({ type: 'ui/toggleSidebar' }),
    },
    {
      id: 'UploadAction',
      name: 'Upload',
      section: Sections.NAVIGATION,
      icon: <CloudUploadOutlined />,
      subtitle: 'Upload tune and logs.',
      perform: () => history.push(Routes.UPLOAD),
    },
    {
      id: 'LoginAction',
      name: 'Login',
      section: Sections.AUTH,
      icon: <LoginOutlined />,
      subtitle: 'Login using email, Google or GitHub account.',
      perform: () => history.push(Routes.LOGIN),
    },
    {
      id: 'SignUpAction',
      name: 'Sign-up',
      section: Sections.AUTH,
      icon: <UserAddOutlined />,
      subtitle: 'Create new account.',
      perform: () => history.push(Routes.SIGN_UP),
    },
    {
      id: 'LogoutAction',
      name: 'Logout',
      section: Sections.AUTH,
      icon: <LogoutOutlined />,
      subtitle: 'Logout current user.',
      perform: logoutAction,
    },
  ], [history, logoutAction]);

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
      {children}
    </KBarProvider>
  );
};

export default CommandPalette;
