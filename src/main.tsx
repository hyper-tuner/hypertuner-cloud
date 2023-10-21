import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { createRoot } from 'react-dom/client';
import ReactGA from 'react-ga4';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import App from './App';
import CommandPalette from './components/CommandPalette';
import { AuthProvider } from './contexts/AuthContext';
import store from './store';
import { environment, isProduction, sentryDsn } from './utils/env';

import '@total-typescript/ts-reset';

if (isProduction) {
  Sentry.init({
    dsn: sentryDsn as string,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    environment: environment as string,
  });

  if (import.meta.env.VITE_GTM_ID) {
    ReactGA.initialize(import.meta.env.VITE_GTM_ID as string);
    ReactGA.send({ hitType: 'pageview', page: window.location.hash });
  }
}

const container = document.getElementById('root');

createRoot(container!).render(
  <HashRouter>
    <AuthProvider>
      <Provider store={store}>
        <CommandPalette>
          <App />
        </CommandPalette>
      </Provider>
    </AuthProvider>
  </HashRouter>,
);
