import { initializeApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { fetchEnv } from './utils/env';

const firebaseConfig = {
  apiKey: fetchEnv('VITE_FIREBASE_API_KEY'),
  authDomain: fetchEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: fetchEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: fetchEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: fetchEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: fetchEnv('VITE_FIREBASE_APP_ID'),
  measurementId: fetchEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const performance = getPerformance(app);
const auth = getAuth(app);

export {
  app,
  analytics,
  performance,
  auth,
};
