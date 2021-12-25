import {
  Form,
  Input,
  Button,
  Checkbox,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { Item } = Form;

const containerStyle = {
  padding: 20,
  maxWidth: 350,
  width: '100%',
  margin: '30px auto 0 auto',
};

const Login = () => {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div style={containerStyle}>
      <Form
        name="basic"
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
        <Item name="remember" valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
          <a className="login-form-forgot" href="/" style={{ float: 'right' }}>
            Forgot password
          </a>
        </Item>
        <Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Log in
          </Button>
        </Item>
        Or <a href="/">register now!</a>
      </Form>
    </div>
  );
};

export default Login;
