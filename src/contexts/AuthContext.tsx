import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Collections, UsersResponse } from '../@types/pocketbase-types';
import { AuthMethodsList, ClientResponseError, client, formatError } from '../pocketbase';
import { Routes } from '../routes';
import { buildRedirectUrl } from '../utils/url';

export enum OAuthProviders {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
}

interface AuthValue {
  currentUser: UsersResponse | null;
  currentUserToken: string | null;
  signUp: (email: string, password: string, username: string) => Promise<UsersResponse>;
  login: (email: string, password: string) => Promise<UsersResponse>;
  refreshUser: () => Promise<UsersResponse | null>;
  sendEmailVerification: () => Promise<void>;
  confirmEmailVerification: (token: string) => Promise<void>;
  confirmResetPassword: (token: string, password: string) => Promise<void>;
  logout: () => void;
  initResetPassword: (email: string) => Promise<void>;
  listAuthMethods: () => Promise<AuthMethodsList>;
  oAuth: (provider: OAuthProviders, code: string, codeVerifier: string) => void;
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
const useAuth = () => useContext<AuthValue>(AuthContext as any);

const users = client.collection(Collections.Users);

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  const [currentUser, setCurrentUser] = useState<UsersResponse | null>(null);
  const [currentUserToken, setCurrentUserToken] = useState<string | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
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
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      login: async (email: string, password: string) => {
        try {
          const authResponse = await users.authWithPassword<UsersResponse>(email, password);
          return Promise.resolve(authResponse.record);
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      refreshUser: async () => {
        try {
          const authResponse = await users.authRefresh<UsersResponse>();
          return Promise.resolve(authResponse.record);
        } catch (_error) {
          client.authStore.clear();
          return Promise.resolve(null);
        }
      },
      sendEmailVerification: async () => {
        try {
          await users.requestVerification(currentUser!.email);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      confirmEmailVerification: async (token: string) => {
        try {
          await users.confirmVerification(token);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      confirmResetPassword: async (token: string, password: string) => {
        try {
          await users.confirmPasswordReset(token, password, password);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      logout: () => {
        client.authStore.clear();
      },
      initResetPassword: async (email: string) => {
        try {
          await users.requestPasswordReset(email);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      listAuthMethods: async () => {
        try {
          const methods = await users.listAuthMethods();
          return Promise.resolve(methods);
        } catch (error) {
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
      oAuth: (provider: OAuthProviders, code: string, codeVerifier: string) => {
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
          return Promise.reject(new Error(formatError(error as ClientResponseError)));
        }
      },
    }),
    [currentUser, currentUserToken],
  );

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { useAuth, AuthProvider };
