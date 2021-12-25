import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_FIREBASE_API_KEY,
  authDomain: process.env.REACT_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_FIREBASE_APP_ID,
  measurementId: process.env.REACT_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebase);

export {
  firebase,
  analytics,
};
