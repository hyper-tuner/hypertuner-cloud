import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import App from './App';
import store from './store';
import {
  environment,
  isProduction,
  sentryDsn,
} from './utils/env';
import { AuthProvider } from './contexts/AuthContext';
import CommandPalette from './components/CommandPalette';

if (isProduction) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    environment,
  });
}

ReactDOM.render(
  <HashRouter>
    <AuthProvider>
      <Provider store={store}>
        <CommandPalette>
          <App />
        </CommandPalette>
      </Provider>
    </AuthProvider>
  </HashRouter>,
  document.getElementById('root'),
);
