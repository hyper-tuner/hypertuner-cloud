import {
  CSSProperties,
  forwardRef,
  Fragment,
  Ref,
  useMemo,
} from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import {
  CloudUploadOutlined,
} from '@ant-design/icons';
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
import App from './App';
import store from './store';
import {
  environment,
  isProduction,
  sentryDsn,
} from './utils/env';
import { AuthProvider } from './contexts/AuthContext';

if (isProduction) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    environment,
  });
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

const initialActions = [
  {
    id: 'uploadAction',
    name: 'Upload',
    keywords: 'back',
    section: 'Navigation',
    // perform: () => history.push('/'),
    icon: <CloudUploadOutlined />,
    subtitle: 'Upload tune and logs.',
  },
];

ReactDOM.render(
  <HashRouter>
    <AuthProvider>
      <Provider store={store}>
        <KBarProvider actions={initialActions}>
          <KBarPortal>
            <KBarPositioner>
              <KBarAnimator style={animatorStyle}>
                <KBarSearch style={searchStyle} />
                <RenderResults />
              </KBarAnimator>
            </KBarPositioner>
          </KBarPortal>
          <App />
        </KBarProvider>
      </Provider>
    </AuthProvider>
  </HashRouter>,
  document.getElementById('root'),
);
