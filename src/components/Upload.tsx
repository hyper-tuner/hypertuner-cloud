import { useState } from 'react';
import {
  Form,
  Divider,
} from 'antd';
import { Link } from 'react-router-dom';
import { Routes } from '../routes';
import { restrictedPage } from './Auth/notifications';

const Upload = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{
      padding: 20,
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <Divider>Reset password</Divider>
      <Link to={Routes.SIGN_UP}>Sign Up</Link>
      <Link to={Routes.LOGIN} style={{ float: 'right' }}>
        Log In
      </Link>
    </div>
  );
};

export default Upload;
