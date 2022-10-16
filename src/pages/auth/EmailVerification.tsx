import { useEffect } from 'react';
import {
  useMatch,
  useNavigate,
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
  const rootMatch = useMatch(Routes.EMAIL_VERIFICATION);

  useEffect(() => {
    if (rootMatch?.params.token) {
      confirmEmailVerification(rootMatch?.params.token)
        .then(() => emailVerificationSuccess())
        .catch((error) => {
          console.error(error);
          emailVerificationFailed(error);
        });

      navigate(Routes.HUB);
    }
  });

  return <Loader />;
};

export default EmailVerification;
