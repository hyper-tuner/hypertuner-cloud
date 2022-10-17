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
  const routeMatch = useMatch(Routes.EMAIL_VERIFICATION);

  useEffect(() => {
    confirmEmailVerification(routeMatch!.params.token!)
      .then(() => emailVerificationSuccess())
      .catch((error) => {
        emailVerificationFailed(error);
      });

    navigate(Routes.HUB);
  }, [confirmEmailVerification, navigate, routeMatch]);

  return <Loader />;
};

export default EmailVerification;
