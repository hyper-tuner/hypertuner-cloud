import {
  Form,
  Input,
  Button,
  Checkbox,
  Divider,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Routes } from '../routes';

const { Item } = Form;

const Login = () => {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 350,
      margin: '0 auto',
    }}>
      <Divider>Login</Divider>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
          />
        </Item>
        <Item
          name="password"
          rules={[{ required: true, message: 'Please input your password' }]}
        >
          <Input.Password
            placeholder="Password"
            prefix={<LockOutlined />}
          />
        </Item>
        <Item valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
          <Link to="/" style={{ float: 'right' }}>
            Forgot password?
          </Link>
        </Item>
        <Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Log in
          </Button>
        </Item>
        Or <Link to={Routes.SIGN_UP}>sign-up now!</Link>
      </Form>
    </div>
  );
};

export default Login;
