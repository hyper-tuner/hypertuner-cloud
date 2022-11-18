import {
  Space,
  Tooltip,
} from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { UsersResponse } from '../@types/pocketbase-types';
import { Colors } from '../utils/colors';

const AuthorName = ({ author }: { author: UsersResponse }) => (
  <Space>
    {author.verifiedAuthor === true && (
      <Tooltip title="Verified author">
        <CheckCircleFilled style={{ color: Colors.PRIMARY }} />
      </Tooltip>
    )}
    {author.username}
  </Space>);

export default AuthorName;
