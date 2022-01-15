
import {
  Layout,
  Space,
  Row,
  Col,
} from 'antd';
import {
  InfoCircleOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  AppState,
  ConfigState,
  StatusState,
} from '../types/state';

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
        <a
          href="https://github.com/speedy-tuner/speedy-tuner-cloud"
          target="__blank"
          rel="noopener noreferrer"
        >
          <Space>
            <GithubOutlined />
            GitHub
          </Space>
        </a>
      </Col>
    </Row>
  </Footer>
);

export default connect(mapStateToProps)(StatusBar);
