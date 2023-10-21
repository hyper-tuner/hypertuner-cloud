import { CheckCircleFilled } from '@ant-design/icons';
import { Space, Tooltip } from 'antd';
import { UsersResponse } from '../@types/pocketbase-types';
import { Colors } from '../utils/colors';

const AuthorName = ({ author }: { author: UsersResponse }) => (
  <Space>
    {author.verifiedAuthor && (
      <Tooltip title="Verified author">
        <CheckCircleFilled style={{ color: Colors.ACCENT }} />
      </Tooltip>
    )}
    {author.username}
  </Space>
);

export default AuthorName;
