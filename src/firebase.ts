import { initializeApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  deleteObject,
  getBytes,
} from 'firebase/storage';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const performance = getPerformance(app);
const auth = getAuth(app);
const db = getFirestore();
const storage = getStorage();

export {
  auth,
  analytics,
  performance,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  ref as storageRef,
  storage,
  uploadBytes,
  uploadBytesResumable,
  deleteObject,
  getBytes,
  doc as fireStoreDoc,
  collection as fireStoreCollection,
  setDoc,
  addDoc,
  getDoc,
  db,
};
