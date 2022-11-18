import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import ReactGA from 'react-ga4';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import store from './store';
import {
  environment,
  isProduction,
  sentryDsn,
} from './utils/env';
import { AuthProvider } from './contexts/AuthContext';
import CommandPalette from './components/CommandPalette';
import { Colors } from './utils/colors';

if (isProduction) {
  Sentry.init({
    dsn: sentryDsn as string,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    environment: environment as string,
  });

  if (import.meta.env.VITE_GTM_ID) {
    ReactGA.initialize(import.meta.env.VITE_GTM_ID);
    ReactGA.send({ hitType: 'pageview', page: window.location.hash });
  }
}

const container = document.getElementById('root');

createRoot(container!).render(
  <HashRouter>
    <AuthProvider>
      <Provider store={store}>
        <CommandPalette>
          <ConfigProvider
            theme={{
              algorithm: [theme.darkAlgorithm],
              token: {
                colorPrimary: Colors.PRIMARY,
                colorBgBase: Colors.BG_BASE,
              },
            }}
          >
            <App />
          </ConfigProvider>
        </CommandPalette>
      </Provider>
    </AuthProvider>
  </HashRouter>,
);
