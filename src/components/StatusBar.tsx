import {
  useEffect,
  useState,
} from 'react';
import {
  Layout,
  Space,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  InfoCircleOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  AppState,
  TuneState,
} from '../types/state';

const { Footer } = Layout;

const mapStateToProps = (state: AppState) => ({
  status: state.status,
  config: state.config,
  tune: state.tune,
});

const Firmware = ({ tune }: { tune: TuneState }) => {
  const [width, setWidth] = useState(1000);
  const calculateWidth = () => setWidth(window.innerWidth - 130);

  useEffect(() => {
    calculateWidth();
    window.addEventListener('resize', calculateWidth);

    return () => window.removeEventListener('resize', calculateWidth);
  }, []);

  return (
    <Space>
      <InfoCircleOutlined />
      <Typography.Text ellipsis style={{ maxWidth: width }}>
        {`${tune.details.signature} - ${tune.details.writeDate} - ${tune.details.author}`}
      </Typography.Text>
    </Space>
  );
};

const StatusBar = ({ tune }: { tune: TuneState }) => (
  <Footer className="app-status-bar">
    <Row>
      <Col span={20}>
        {tune?.details?.author && <Firmware tune={tune} />}
      </Col>
      <Col span={4} style={{ textAlign: 'right' }}>
        <a
          href="https://github.com/hyper-tuner/hyper-tuner-cloud"
          target="__blank"
          rel="noopener noreferrer"
        >
          <Space className="github-link">
            <GithubOutlined />
            GitHub
          </Space>
        </a>
      </Col>
    </Row>
  </Footer>
);

export default connect(mapStateToProps)(StatusBar);
