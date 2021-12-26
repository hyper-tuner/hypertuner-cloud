import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Divider,
} from 'antd';
import { MailOutlined } from '@ant-design/icons';
import {
  Link,
  useHistory,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';
import {
  resetFailed,
  resetSuccessful,
} from './notifications';
import { containerStyle } from './common';

const { Item } = Form;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const history = useHistory();

  const onFinish = async ({ email, password }: { form: any, email: string, password: string }) => {
    setIsLoading(true);
    try {
      await resetPassword(email);
      resetSuccessful();
      history.push(Routes.LOGIN);
    } catch (error) {
      form.resetFields();
      console.warn(error);
      resetFailed(error as Error);
      setIsLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Divider>Reset password</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        validateMessages={validateMessages}
        autoComplete="off"
        form={form}
      >
        <Item
          name="email"
          rules={[{ required: true, type: 'email' }]}
          hasFeedback
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isLoading}
          >
            Reset password
          </Button>
        </Item>
        <Link to={Routes.SIGN_UP}>Sign Up now</Link>
        <Link to={Routes.LOGIN} style={{ float: 'right' }}>
          Log In
        </Link>
      </Form>
    </div>
  );
};

export default ResetPassword;
