import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Divider,
  notification,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes } from '../../routes';
import validateMessages from './validateMessages';

const { Item } = Form;

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const onFinish = async ({ email, password }: { email: string, password: string }) => {
    setIsLoading(true);

    try {
      await signUp(email, password);
    } catch (err) {
      console.warn(err);
      notification.error({
        message: 'Failed to create an account',
        description: (err as Error).message,
      });
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 350,
      margin: '0 auto',
    }}>
      <Divider>Sign Up</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        validateMessages={validateMessages}
        autoComplete="off"
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
        <Item
          name="password"
          rules={[
            { required: true },
            { pattern: strongPassword, message: 'Password is too weak!' },
          ]}
          hasFeedback
        >
          <Input.Password
            placeholder="Password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item
          name="passwordConfirmation"
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error('Passwords don\'t match!'));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password
            placeholder="Password confirmation"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={isLoading}
          >
            Sign up
          </Button>
        </Item>
        Or <Link to={Routes.LOGIN}>login</Link> if you already have an account!
      </Form>
    </div>
  );
};

export default SignUp;
