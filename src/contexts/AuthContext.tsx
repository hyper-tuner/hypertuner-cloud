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
} from '../firebase';

const AuthContext = createContext<any>(null);

interface Value {
  currentUser?: UserCredential,
  signUp: (email: string, password: string) => Promise<UserCredential>,
  login: (email: string, password: string) => Promise<UserCredential>,
}

const useAuth = () => useContext<Value>(AuthContext);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signUp = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
  const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);

  const value = useMemo(() => ({
    currentUser,
    signUp,
    login,
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
