import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  client,
  formatError,
  User,
} from '../pocketbase';
import { buildRedirectUrl } from '../utils/url';
import { Collections } from '../@types/pocketbase-types';
import { Routes } from '../routes';

// TODO: this should be imported from pocketbase but currently is not exported
export type AuthProviderInfo = {
  name: string;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  authUrl: string;
};

// TODO: this should be imported from pocketbase but currently is not exported
export type AuthMethodsList = {
  [key: string]: any;
  emailPassword: boolean;
  authProviders: Array<AuthProviderInfo>;
};

export enum OAuthProviders {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
};

interface AuthValue {
  currentUser: User | null,
  signUp: (email: string, password: string) => Promise<User>,
  login: (email: string, password: string) => Promise<User>,
  refreshUser: () => Promise<User | null>,
  sendEmailVerification: () => Promise<void>,
  confirmEmailVerification: (token: string) => Promise<void>,
  confirmResetPassword: (token: string, password: string) => Promise<void>,
  logout: () => void,
  initResetPassword: (email: string) => Promise<void>,
  listAuthMethods: () => Promise<AuthMethodsList>,
  oAuth: (provider: OAuthProviders, code: string, codeVerifier: string) => Promise<void>,
  updateUsername: (username: string) => Promise<void>,
}

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
        client.users.requestVerification(user.email);
        await client.users.authViaEmail(user.email, password);

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
    confirmResetPassword: async (token: string, password: string) => {
      try {
        await client.users.confirmPasswordReset(token, password, password);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    logout: async () => {
      client.authStore.clear();
    },
    initResetPassword: async (email: string) => {
      try {
        await client.users.requestPasswordReset(email);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    listAuthMethods: async () => {
      try {
        const methods = await client.users.listAuthMethods();
        return Promise.resolve(methods);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    oAuth: async (provider: OAuthProviders, code: string, codeVerifier: string) => {
      client.users.authViaOAuth2(
        provider,
        code,
        codeVerifier,
        buildRedirectUrl(Routes.REDIRECT_PAGE_OAUTH_CALLBACK, { provider }),
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
  }), [currentUser]);

  useEffect(() => {
    setCurrentUser(client.authStore.model as User | null);

    const storeUnsubscribe = client.authStore.onChange((_token, model) => {
      setCurrentUser(model as User | null);
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
