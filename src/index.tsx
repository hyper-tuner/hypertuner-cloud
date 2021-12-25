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

if (isProduction) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    environment,
  });
}

ReactDOM.render(
  <AuthProvider>
    <HashRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </HashRouter>
  </AuthProvider>,
  document.getElementById('root'),
);
