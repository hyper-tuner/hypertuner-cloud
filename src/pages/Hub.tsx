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
import useDb from '../hooks/useDb';
import { TuneDbDocument } from '../types/dbData';
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
  const { searchTunes } = useDb();
  const navigate = useNavigate();

  const [dataSource, setDataSource] = useState<any>([]);
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
    searchTunes().then((list) => {
      setDataSource(list.documents.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        author: 'karniv00l',
        displacement: `${tune.displacement}l`,
        publishedAt: new Date(tune.$updatedAt * 1000).toLocaleString(),
        stars: 0,
      })));
      setIsLoading(false);
    });
  }, [searchTunes]);

  const columns = [
    {
      title: 'Vehicle name',
      dataIndex: 'vehicleName',
      key: 'vehicleName',
    },
    {
      title: 'Engine make',
      dataIndex: 'engineMake',
      key: 'engineMake',
    },
    {
      title: 'Engine code',
      dataIndex: 'engineCode',
      key: 'engineCode',
    },
    {
      title: 'Displacement',
      dataIndex: 'displacement',
      key: 'displacement',
    },
    {
      title: 'Cylinders',
      dataIndex: 'cylindersCount',
      key: 'cylindersCount',
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
            dataSource.map((tune: TuneDbDocument) => (
              <Col span={16} sm={8} key={tune.tuneFile}>
                <Card
                  title={tune.vehicleName}
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
                    {tune.engineMake} {tune.engineCode} {tune.year}
                  </Typography.Text>
                </Card>
              </Col>
            )))}
        </Row>}
    </div>
  );
};

export default Hub;
