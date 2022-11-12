import { useEffect } from 'react';
import {
  useMatch,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { AuthProviderInfo } from '../../pocketbase';
import Loader from '../../components/Loader';
import {
  OAuthProviders,
  useAuth,
} from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import { logInSuccessful } from './notifications';

const OauthCallback = () => {
  const { oAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeMatch = useMatch(Routes.OAUTH_CALLBACK);

  useEffect(() => {
    const authProviders = JSON.parse(window.localStorage.getItem('authProviders') || '') as unknown as AuthProviderInfo[];

    oAuth(
      routeMatch?.params.provider as OAuthProviders,
      searchParams.get('code')!,
      authProviders.find((provider) => provider.name === routeMatch?.params.provider)?.codeVerifier!,
    )
      .then(() => {
        logInSuccessful();
        navigate(Routes.HUB, { replace: true });
      });
  }, [navigate, oAuth, routeMatch, searchParams]);

  return <Loader />;
};

export default OauthCallback;
