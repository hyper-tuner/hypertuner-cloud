import {
  User,
  UserCredential,
} from 'firebase/auth';
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
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from '../firebase';

interface AuthValue {
  currentUser: User | null,
  signUp: (email: string, password: string) => Promise<void>,
  login: (email: string, password: string) => Promise<UserCredential>,
  logout: () => Promise<void>,
  resetPassword: (email: string) => Promise<void>,
  googleAuth: () => Promise<void>,
  githubAuth: () => Promise<void>,
  refreshToken: () => Promise<string> | undefined,
}

const AuthContext = createContext<AuthValue | null>(null);

const useAuth = () => useContext<AuthValue>(AuthContext as any);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const value = useMemo(() => ({
    currentUser,
    signUp: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => sendEmailVerification(userCredential.user)),
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
    googleAuth: async () => {
      const provider = new GoogleAuthProvider().addScope('https://www.googleapis.com/auth/userinfo.email');
      const credentials = await signInWithPopup(auth, provider);
      setCurrentUser(credentials.user);
    },
    githubAuth: async () => {
      const provider = new GithubAuthProvider().addScope('user:email');
      const credentials = await signInWithPopup(auth, provider);
      setCurrentUser(credentials.user);
    },
    refreshToken: () => auth.currentUser?.getIdToken(true),
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
