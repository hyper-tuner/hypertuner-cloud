import { useEffect } from 'react';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import Loader from '../../components/Loader';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import {
  emailVerificationFailed,
  emailVerificationSuccess,
} from './notifications';

const EmailVerification = () => {
  const { confirmEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (userId && secret) {
      confirmEmailVerification(userId, secret)
        .then(() => emailVerificationSuccess())
        .catch((error) => {
          console.error(error);
          emailVerificationFailed(error);
        });
    } else {
      emailVerificationFailed(new Error('Invalid URL'));
    }

    navigate(Routes.HUB);
  });

  return <Loader />;
};

export default EmailVerification;
