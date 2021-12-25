
import {
  Layout,
  Space,
  Row,
  Col,
} from 'antd';
import {
  InfoCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  AppState,
  ConfigState,
  StatusState,
} from '@speedy-tuner/types';

const { Footer } = Layout;

const mapStateToProps = (state: AppState) => ({
  status: state.status,
  config: state.config,
});

const firmware = (signature: string) => (
  <Space>
    <InfoCircleOutlined />
    {signature}
  </Space>
);

const StatusBar = ({ status, config }: { status: StatusState, config: ConfigState }) => (
  <Footer className="app-status-bar">
    <Row>
      <Col span={12}>
        {config.megaTune && firmware(config.megaTune.signature)}
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <FieldTimeOutlined />
          {status.text}
        </Space>
      </Col>
    </Row>
  </Footer>
);

export default connect(mapStateToProps)(StatusBar);
