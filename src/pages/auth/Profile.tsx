import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Divider,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import validateMessages from './validateMessages';
import { useAuth } from '../../contexts/AuthContext';
import { restrictedPage } from './notifications';
import { Routes } from '../../routes';

const { Item } = Form;

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!currentUser) {
      restrictedPage();
      navigate(Routes.LOGIN);
    }
  }, [currentUser, navigate]);

  return (
    <div className="small-container">
      <Divider>Your Profile</Divider>
      <Form
        validateMessages={validateMessages}
        form={form}
        autoComplete="off"
      >
        <Item
          name="username"
          rules={[{ required: true }]}
          hasFeedback
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Item>
        <Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
          >
            Save
          </Button>
        </Item>
      </Form>
    </div>
  );
};

export default Profile;
