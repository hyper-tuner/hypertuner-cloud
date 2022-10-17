import { useEffect } from 'react';
import {
  useMatch,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import Loader from '../../components/Loader';
import {
  AuthProviderInfo,
  useAuth,
} from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import { logInSuccessful } from './notifications';

const OauthCallback = () => {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeMatch = useMatch(Routes.OAUTH_CALLBACK);

  useEffect(() => {
    console.log({ searchParams: searchParams.toString() });
    console.log({ routeMatch });

    const authProviders = JSON.parse(window.localStorage.getItem('authProviders') || '') as unknown as AuthProviderInfo[];

    switch (routeMatch?.params.provider) {
      case 'google':
        // TODO: add error handling
        googleAuth(searchParams.get('code')!, authProviders.find((provider) => provider.name === 'google')?.codeVerifier!)
          .then(() => {
            logInSuccessful();
            navigate(Routes.HUB);
          });
        break;

      default:
        break;
    }
  }, [googleAuth, navigate, routeMatch, searchParams]);

  return <Loader />;
};

export default OauthCallback;
