import { useEffect } from 'react';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import Loader from '../../components/Loader';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import {
  logInSuccessful,
  magicLinkConfirmationFailed,
} from './notifications';

const MagicLinkConfirmation = () => {
  const { confirmMagicLink } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (userId && secret) {
      confirmMagicLink(userId, secret)
        .then(() => logInSuccessful())
        .catch((error) => {
          console.error(error);
          magicLinkConfirmationFailed(error);
        });
    } else {
      magicLinkConfirmationFailed(new Error('Invalid URL'));
    }

    navigate(Routes.HUB);
  });

  return <Loader />;
};

export default MagicLinkConfirmation;
