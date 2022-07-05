import {
  Badge,
  Button,
  Card,
  Col,
  Grid,
  Input,
  Row,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  StarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  generatePath,
  useNavigate,
} from 'react-router';
import { Timestamp } from 'firebase/firestore/lite';
import useDb from '../hooks/useDb';
import { TuneDbDataLegacy } from '../types/dbData';
import { Routes } from '../routes';
import { buildFullUrl } from '../utils/url';

const { useBreakpoint } = Grid;

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

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const Hub = () => {
  const { md } = useBreakpoint();
  const { listTunes } = useDb();
  const navigate = useNavigate();
  const [tunes, setTunes] = useState<TuneDbDataLegacy[]>([]);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const copyToClipboard = async (shareUrl: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const loadData = useCallback(() => {
    listTunes().then((data) => {
      const temp: TuneDbDataLegacy[] = [];

      data.forEach((tuneSnapshot) => {
        temp.push(tuneSnapshot.data());
      });

      setTunes(temp);
      setDataSource(temp.map((tune) => ({
        key: tune.id,
        tuneId: tune.id,
        make: tune.details!.make,
        model: tune.details!.model,
        year: tune.details!.year,
        author: 'karniv00l',
        publishedAt: new Date((tune.createdAt as Timestamp).seconds * 1000).toLocaleString(),
        stars: 0,
      })));
      setIsLoading(false);
    });
  }, [listTunes]);

  const columns = [
    {
      title: 'Make',
      dataIndex: 'make',
      key: 'make',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Published',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
    },
    {
      title: <StarOutlined />,
      dataIndex: 'stars',
      key: 'stars',
    },
    {
      dataIndex: 'tuneId',
      render: (tuneId: string) => (
        <Space>
          <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
            <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(buildFullUrl([tunePath(tuneId)]))} />
          </Tooltip>
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate(tunePath(tuneId))} />
        </Space>
      ),
      key: 'tuneId',
    },
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // TODO: fix this

  return (
    <div className="large-container">
      <Typography.Title>Hub</Typography.Title>
      <Input style={{ marginBottom: 10, height: 40 }} placeholder="Search..." />
      {md ?
        <Table dataSource={dataSource} columns={columns} loading={isLoading} />
        :
        <Row gutter={[16, 16]}>
          {isLoading ? loadingCards : (
            tunes.map((tune) => (
              <Col span={16} sm={8} key={tune.tuneFile}>
                <Card
                  title={tune.details!.model}
                  actions={[
                    <Badge count={0} showZero size="small" color="gold">
                      <StarOutlined />
                    </Badge>,
                    <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                      <CopyOutlined onClick={() => copyToClipboard(buildFullUrl([tunePath(tune.id!)]))} />
                    </Tooltip>,
                    <ArrowRightOutlined onClick={() => navigate(tunePath(tune.id!))} />,
                  ]}
                >
                  <Typography.Text ellipsis>
                    {tune.details!.make} {tune.details!.model} {tune.details!.year}
                  </Typography.Text>
                </Card>
              </Col>
            )))}
        </Row>}
    </div>
  );
};

export default Hub;
