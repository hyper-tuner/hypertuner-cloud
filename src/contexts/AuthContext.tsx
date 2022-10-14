import {
  ID,
  Models,
} from 'appwrite';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  account,
  client,
} from '../appwrite';
import Loader from '../components/Loader';
import { Routes } from '../routes';
import {
  buildFullUrl,
  buildRedirectUrl,
} from '../utils/url';

export type SessionList = Models.SessionList;
export type LogList = Models.LogList;
export type Account = Models.Account<Models.Preferences>;

interface AuthValue {
  currentUser: Account | null,
  signUp: (email: string, password: string, username: string) => Promise<Account>,
  login: (email: string, password: string) => Promise<Account>,
  sendMagicLink: (email: string) => Promise<void>,
  confirmMagicLink: (userId: string, secret: string) => Promise<Account>,
  sendEmailVerification: () => Promise<void>,
  confirmEmailVerification: (userId: string, secret: string) => Promise<void>,
  confirmResetPassword: (userId: string, secret: string, password: string) => Promise<void>,
  logout: () => Promise<void>,
  initResetPassword: (email: string) => Promise<void>,
  googleAuth: () => Promise<void>,
  githubAuth: () => Promise<void>,
  facebookAuth: () => Promise<void>,
  updateUsername: (username: string) => Promise<void>,
  updatePassword: (password: string, oldPassword: string) => Promise<void>,
  getSessions: () => Promise<SessionList>,
  getLogs: () => Promise<LogList>,
}

const OAUTH_REDIRECT_URL = buildFullUrl();
const MAGIC_LINK_REDIRECT_URL = buildRedirectUrl(Routes.REDIRECT_PAGE_MAGIC_LINK_CONFIRMATION);
const EMAIL_VERIFICATION_REDIRECT_URL = buildRedirectUrl(Routes.REDIRECT_PAGE_EMAIL_VERIFICATION);
const RESET_PASSWORD_REDIRECT_URL = buildRedirectUrl(Routes.REDIRECT_PAGE_RESET_PASSWORD);

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/userinfo.email'];
const GITHUB_SCOPES = ['user:email'];
const FACEBOOK_SCOPES = ['email'];

const AuthContext = createContext<AuthValue | null>(null);

const useAuth = () => useContext<AuthValue>(AuthContext as any);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const value = useMemo(() => ({
    currentUser,
    signUp: async (email: string, password: string, username: string) => {
      try {
        await account.create(ID.unique(), email, password, username);
        await account.createEmailSession(email, password);
        const user = await account.get();
        setCurrentUser(user);
        return Promise.resolve(user);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    login: async (email: string, password: string) => {
      try {
        await account.createEmailSession(email, password);
        const user = await account.get();
        setCurrentUser(user);
        return Promise.resolve(user);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    sendMagicLink: async (email: string) => {
      try {
        await account.createMagicURLSession(ID.unique(), email, MAGIC_LINK_REDIRECT_URL);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    confirmMagicLink: async (userId: string, secret: string) => {
      try {
        await account.updateMagicURLSession(userId, secret);
        const user = await account.get();
        setCurrentUser(user);
        return Promise.resolve(user);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    sendEmailVerification: async () => {
      try {
        await account.createVerification(EMAIL_VERIFICATION_REDIRECT_URL);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    confirmEmailVerification: async (userId: string, secret: string) => {
      try {
        await account.updateVerification(userId, secret);
        const user = await account.get();
        setCurrentUser(user);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    confirmResetPassword: async (userId: string, secret: string, password: string) => {
      try {
        await account.updateRecovery(userId, secret, password, password);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    logout: async () => {
      try {
        await account.deleteSession('current');
        setCurrentUser(null);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    initResetPassword: async (email: string) => {
      try {
        await account.createRecovery(email, RESET_PASSWORD_REDIRECT_URL);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    googleAuth: async () => {
      account.createOAuth2Session(
        'google',
        OAUTH_REDIRECT_URL,
        OAUTH_REDIRECT_URL,
        GOOGLE_SCOPES,
      );
    },
    githubAuth: async () => {
      account.createOAuth2Session(
        'github',
        OAUTH_REDIRECT_URL,
        OAUTH_REDIRECT_URL,
        GITHUB_SCOPES,
      );
    },
    facebookAuth: async () => {
      account.createOAuth2Session(
        'facebook',
        OAUTH_REDIRECT_URL,
        OAUTH_REDIRECT_URL,
        FACEBOOK_SCOPES,
      );
    },
    updateUsername: async (username: string) => {
      try {
        await account.updateName(username);
        const user = await account.get();
        setCurrentUser(user);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    updatePassword: async (password: string, oldPassword: string) => {
      try {
        await account.updatePassword(password, oldPassword);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    getSessions: () => account.listSessions(),
    getLogs: () => account.listLogs(),
  }), [currentUser]);

  useEffect(() => {
    account.get().then((user) => {
      console.info('Logged as:', user.name || 'Unknown');
      setCurrentUser(user);
      setIsLoading(false);
    }).catch(() => {
      console.info('User not logged in');
    }).finally(() => setIsLoading(false));

    const unsubscribe = client.subscribe('account', (event) => {
      console.info('Account event', event);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <Loader /> : children}
    </AuthContext.Provider>
  );
};

export {
  useAuth,
  AuthProvider,
};
