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
} from '../firebase';

const AuthContext = createContext<any>(null);

interface Value {
  currentUser?: UserCredential,
  signUp: (email: string, password: string) => Promise<UserCredential>,
}

const useAuth = () => useContext<Value>(AuthContext);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const signUp = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
  const value = useMemo(() => ({
    currentUser,
    signUp,
  }), [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setCurrentUser);

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export {
  useAuth,
  AuthProvider,
};
