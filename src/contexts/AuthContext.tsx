import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from 'pocketbase';
import { account } from '../appwrite';
import {
  client,
  formatError,
} from '../pocketbase';
import { buildFullUrl } from '../utils/url';
import { Collections } from '../@types/pocketbase-types';

interface AuthValue {
  currentUser: User | null,
  signUp: (email: string, password: string) => Promise<User>,
  login: (email: string, password: string) => Promise<User>,
  refreshUser: () => Promise<User | null>,
  sendEmailVerification: () => Promise<void>,
  confirmEmailVerification: (secret: string) => Promise<void>,
  confirmResetPassword: (userId: string, secret: string, password: string) => Promise<void>,
  logout: () => Promise<void>,
  initResetPassword: (email: string) => Promise<void>,
  googleAuth: () => Promise<void>,
  githubAuth: () => Promise<void>,
  facebookAuth: () => Promise<void>,
  updateUsername: (username: string) => Promise<void>,
  updatePassword: (password: string, oldPassword: string) => Promise<void>,
}

const OAUTH_REDIRECT_URL = buildFullUrl();

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/userinfo.email'];
const GITHUB_SCOPES = ['user:email'];
const FACEBOOK_SCOPES = ['email'];

const AuthContext = createContext<AuthValue | null>(null);

const useAuth = () => useContext<AuthValue>(AuthContext as any);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = useMemo(() => ({
    currentUser,
    signUp: async (email: string, password: string) => {
      try {
        const user = await client.users.create({
          email,
          password,
          passwordConfirm: password,
        });
        await client.users.authViaEmail(email, password);
        await client.users.requestVerification(user.email);

        return Promise.resolve(user);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    login: async (email: string, password: string) => {
      try {
        const authResponse = await client.users.authViaEmail(email, password);
        return Promise.resolve(authResponse.user);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    refreshUser: async () => {
      try {
        const authResponse = await client.users.refresh();
        return Promise.resolve(authResponse.user);
      } catch (error) {
        client.authStore.clear();
        return Promise.resolve(null);
      }
    },
    sendEmailVerification: async () => {
      try {
        await client.users.requestVerification(currentUser!.email);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    confirmEmailVerification: async (token: string) => {
      try {
        await client.users.confirmVerification(token);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    confirmResetPassword: async (userId: string, secret: string, password: string) => {
      try {
        await account.updateRecovery(userId, secret, password, password);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    logout: async () => {
      try {
        client.authStore.clear();
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    initResetPassword: async (email: string) => {
      try {
        await client.users.requestPasswordReset(email);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
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
        await client.records.update(Collections.Profiles, currentUser!.profile!.id, {
          username,
        });
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    updatePassword: async (password: string, oldPassword: string) => {
      try {
        await account.updatePassword(password, oldPassword);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
  }), [currentUser]);

  useEffect(() => {
    setCurrentUser(client.authStore.model as User | null);

    const storeUnsubscribe = client.authStore.onChange((_token, model) => {
      setCurrentUser(model as User | null);
      if (model) {
        console.info('Logged in as', model.email);
      } else {
        console.info('Logged out');
      }
    });

    client.realtime.subscribe(Collections.Tunes, (event) => {
      console.info('Tunes event', event);
    });

    client.realtime.subscribe(Collections.Profiles, (event) => {
      console.info('Profiles event', event);
    });

    return () => {
      storeUnsubscribe();
      client.realtime.unsubscribe(Collections.Tunes);
      client.realtime.unsubscribe(Collections.Profiles);
    };
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
