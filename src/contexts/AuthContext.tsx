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
} from '../pocketbase';
import { buildRedirectUrl } from '../utils/url';
import {
  Collections,
  UsersResponse,
} from '../@types/pocketbase-types';
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
  currentUser: UsersResponse | null,
  currentUserToken: string | null,
  signUp: (email: string, password: string, username: string) => Promise<UsersResponse>,
  login: (email: string, password: string) => Promise<UsersResponse>,
  refreshUser: () => Promise<UsersResponse | null>,
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

const users = client.collection(Collections.Users);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<UsersResponse | null>(null);
  const [currentUserToken, setCurrentUserToken] = useState<string | null>(null);

  const value = useMemo(() => ({
    currentUser,
    currentUserToken,
    signUp: async (email: string, password: string, username: string) => {
      try {
        const user = await users.create<UsersResponse>({
          email,
          password,
          passwordConfirm: password,
          username,
        });
        users.requestVerification(email);
        await users.authWithPassword(email, password);

        return Promise.resolve(user);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    login: async (email: string, password: string) => {
      try {
        const authResponse = await users.authWithPassword<UsersResponse>(email, password);
        return Promise.resolve(authResponse.record);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    refreshUser: async () => {
      try {
        const authResponse = await users.authRefresh<UsersResponse>();
        return Promise.resolve(authResponse.record);
      } catch (error) {
        client.authStore.clear();
        return Promise.resolve(null);
      }
    },
    sendEmailVerification: async () => {
      try {
        await users.requestVerification(currentUser!.email);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    confirmEmailVerification: async (token: string) => {
      try {
        await users.confirmVerification(token);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    confirmResetPassword: async (token: string, password: string) => {
      try {
        await users.confirmPasswordReset(token, password, password);
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
        await users.requestPasswordReset(email);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    listAuthMethods: async () => {
      try {
        const methods = await users.listAuthMethods();
        return Promise.resolve(methods);
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
    oAuth: async (provider: OAuthProviders, code: string, codeVerifier: string) => {
      users.authWithOAuth2(
        provider,
        code,
        codeVerifier,
        buildRedirectUrl(Routes.REDIRECT_PAGE_OAUTH_CALLBACK, { provider }),
      );
    },
    updateUsername: async (username: string) => {
      try {
        await client.collection(Collections.Users).update(currentUser!.id, {
          username,
        });
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(new Error(formatError(error)));
      }
    },
  }), [currentUser, currentUserToken]);

  useEffect(() => {
    setCurrentUser(client.authStore.model as UsersResponse | null);
    setCurrentUserToken(client.authStore.token);

    const storeUnsubscribe = client.authStore.onChange((token, model) => {
      setCurrentUser(model as UsersResponse | null);
      setCurrentUserToken(token);
    });

    return () => {
      storeUnsubscribe();
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
