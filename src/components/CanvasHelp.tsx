import {
  Popover,
  Space,
  Typography,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const CanvasHelp = () => (
  <div style={{ marginTop: -20, marginBottom: 10, textAlign: 'left', marginLeft: 20 }}>
    <Popover
      placement="bottom"
      content={
        <Space direction="vertical">
          <Title level={5}>Navigation</Title>
          <Text>Pinch to zoom</Text>
          <Text>Drag to pan</Text>
          <Text>Ctrl + wheel scroll to zoom X axis</Text>
          <Text>Hold Shift to speed up zoom 5 times</Text>
        </Space>
      }
    >
      <QuestionCircleOutlined />
    </Popover>
  </div>
);

export default CanvasHelp;
