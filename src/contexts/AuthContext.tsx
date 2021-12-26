import { UserCredential } from 'firebase/auth';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
} from '../firebase';

const AuthContext = createContext<any>(null);

interface AuthValue {
  currentUser?: UserCredential,
  signUp: (email: string, password: string) => Promise<UserCredential>,
  login: (email: string, password: string) => Promise<UserCredential>,
  logout: () => Promise<void>,
  resetPassword: (email: string) => Promise<UserCredential>,
}

const useAuth = () => useContext<AuthValue>(AuthContext);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const value = useMemo(() => ({
    currentUser,
    signUp: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => sendEmailVerification(userCredential.user)),
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
  }), [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export {
  useAuth,
  AuthProvider,
};
