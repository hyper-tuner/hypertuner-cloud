import {
  Card,
  Col,
  List,
  Row,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  HeartOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import useDb from '../hooks/useDb';
import { TuneDbData } from '../types/dbData';

const containerStyle = {
  padding: 20,
  maxWidth: 800,
  margin: '0 auto',
};

const loadingCards = (
  <>
    <Col span={8}>
      <Card loading />
    </Col>
    <Col span={8}>
      <Card loading />
    </Col>
    <Col span={8}>
      <Card loading />
    </Col>
  </>
);

const Hub = () => {
  const [tunes, setTunes] = useState<TuneDbData[]>([]);
  const { listTunes } = useDb();

  const loadData = useCallback(() => {
    listTunes().then((data) => {
      const temp: TuneDbData[] = [];

      data.forEach((tuneSnapshot) => {
        temp.push(tuneSnapshot.data());
      });

      setTunes(temp);
    });
  }, [listTunes]);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={containerStyle}>
      <Typography.Title>Hub</Typography.Title>
      <Row gutter={16}>
        {tunes.length === 0 ? loadingCards : (
          tunes.map((tune) => (
            <Col span={8} key={tune.tuneFile}>
              <Card
                title={tune.details!.model}
                actions={[
                  <HeartOutlined />,
                  <CopyOutlined />,
                  <MoreOutlined />,
                ]}
              >
                <List>
                  {tune.details!.make} {tune.details!.model} {tune.details!.year}
                </List>
              </Card>
            </Col>
          )))}
      </Row>
    </div>
  );
};

export default Hub;
