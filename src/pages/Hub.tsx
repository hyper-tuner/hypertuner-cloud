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
import debounce from 'lodash.debounce';
import useDb from '../hooks/useDb';
import { TuneDbDocument } from '../types/dbData';
import { Routes } from '../routes';
import { buildFullUrl } from '../utils/url';
import { aspirationMapper } from '../utils/tune/mappers';

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

  const loadData = debounce(async (searchText?: string) => {
    setIsLoading(true);
    const list = await searchTunes(searchText);
    // TODO: create `unpublishedTunes` collection for this
    const filtered = list.documents.filter((tune) => !!tune.vehicleName);
    setDataSource(filtered.map((tune) => ({
      ...tune,
      key: tune.tuneId,
      year: tune.year,
      author: '?',
      displacement: `${tune.displacement}l`,
      aspiration: aspirationMapper[tune.aspiration],
      updatedAt: new Date(tune.$updatedAt * 1000).toLocaleString(),
      stars: 0,
    })));
    setIsLoading(false);
  }, 300);

  const debounceLoadData = useCallback((value: string) => loadData(value), [loadData]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // TODO: fix this

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
      title: 'Aspiration',
      dataIndex: 'aspiration',
      key: 'aspiration',
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Published',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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

  return (
    <div className="large-container">
      <Typography.Title>Hub</Typography.Title>
      <Input
        tabIndex={0}
        style={{ marginBottom: 10, height: 40 }}
        placeholder="Search..."
        onChange={({ target }) => debounceLoadData(target.value)}
      />
      {md ?
        <Table dataSource={dataSource} columns={columns} loading={isLoading} pagination={false} />
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
