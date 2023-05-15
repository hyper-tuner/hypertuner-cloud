import { Button, Divider, Form, Input } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import { passwordUpdateFailed, passwordUpdateSuccess } from './notifications';
import { passwordRules } from '../../utils/form';
import validateMessages from './validateMessages';

const { Item } = Form;

const ResetPasswordConfirmation = () => {
  const { confirmResetPassword } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const routeMatch = useMatch(Routes.RESET_PASSWORD_CONFIRMATION);

  const changePassword = async ({ password }: { password: string }) => {
    setIsLoading(true);
    try {
      await confirmResetPassword(routeMatch!.params.token!, password);
      passwordUpdateSuccess();
      navigate(Routes.LOGIN);
    } catch (error) {
      passwordUpdateFailed(error as Error);
      form.resetFields();
      setIsLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <Divider>Change password</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={changePassword}
        validateMessages={validateMessages}
        autoComplete='off'
        form={form}
      >
        <Item name='password' rules={passwordRules} hasFeedback>
          <Input.Password
            placeholder='New password'
            autoComplete='new-password'
            prefix={<LockOutlined />}
          />
        </Item>
        <Item>
          <Button
            type='primary'
            htmlType='submit'
            style={{ width: '100%' }}
            icon={<LockOutlined />}
            loading={isLoading}
          >
            Change
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>Sign Up</Link>
        <Link to={Routes.RESET_PASSWORD} style={{ float: 'right' }}>
          Forgot password?
        </Link>
      </Form>
    </div>
  );
};

export default ResetPasswordConfirmation;
