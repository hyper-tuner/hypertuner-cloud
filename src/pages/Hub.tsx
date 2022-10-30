import {
  Button,
  Grid,
  Input,
  InputRef,
  Pagination,
  Space,
  Table,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/lib/table';
import {
  CopyOutlined,
  StarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  generatePath,
  useNavigate,
} from 'react-router';
import debounce from 'lodash.debounce';
import useDb from '../hooks/useDb';
import { Routes } from '../routes';
import { buildFullUrl } from '../utils/url';
import { aspirationMapper } from '../utils/tune/mappers';
import {
  copyToClipboard,
  isClipboardSupported,
} from '../utils/clipboard';
import { isEscape } from '../utils/keyboard/shortcuts';
import {
  TunesRecordFull,
  UsersRecordFull,
} from '../types/dbData';
import { formatTime } from '../utils/time';

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const Hub = () => {
  const { xs } = useBreakpoint();
  const { searchTunes } = useDb();
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<TunesRecordFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const searchRef = useRef<InputRef | null>(null);

  const loadData = debounce(async (searchText: string) => {
    setIsLoading(true);
    try {
      const { items, totalItems } = await searchTunes(searchText, page, pageSize);
      setTotal(totalItems);
      const mapped = items.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        author: (tune.expand.author as unknown as UsersRecordFull).username,
        displacement: `${tune.displacement}l`,
        aspiration: aspirationMapper[tune.aspiration],
        published: formatTime(tune.updated),
        stars: 0,
      }));
      setDataSource(mapped as any);
    } catch (error) {
      // request cancelled
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const debounceLoadData = useCallback((value: string) => {
    setSearchQuery(value);
    loadData(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGlobalKeyboard = useCallback((e: KeyboardEvent) => {
    if (isEscape(e)) {
      setSearchQuery('');
      loadData('');
    }
  }, [loadData]);

  useEffect(() => {
    loadData('');

    window.addEventListener('keydown', handleGlobalKeyboard);

    // searchRef.current?.focus(); // autofocus

    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columns: ColumnsType<any> = [
    {
      title: 'Tunes',
      render: (tune: TunesRecordFull) => (
        <>
          <Title level={5}>{tune.vehicleName}</Title>
          <Space direction="vertical">
            <Text type="secondary">{tune.author}, {tune.published}</Text>
            <Text>{tune.engineMake}, {tune.engineCode}, {tune.displacement}, {tune.cylindersCount} cylinders, {tune.aspiration}</Text>
            <Text code>{tune.signature}</Text>
          </Space>
        </>
      ),
      responsive: ['xs'],
    },
    {
      title: 'Vehicle name',
      dataIndex: 'vehicleName',
      key: 'vehicleName',
      responsive: ['sm'],
    },
    {
      title: 'Make',
      dataIndex: 'engineMake',
      key: 'engineMake',
      responsive: ['sm'],
    },
    {
      title: 'Engine code',
      dataIndex: 'engineCode',
      key: 'engineCode',
      responsive: ['sm'],
    },
    {
      title: 'Displacement',
      dataIndex: 'displacement',
      key: 'displacement',
      responsive: ['sm'],
    },
    {
      title: 'Cylinders',
      dataIndex: 'cylindersCount',
      key: 'cylindersCount',
      responsive: ['sm'],
    },
    {
      title: 'Aspiration',
      dataIndex: 'aspiration',
      key: 'aspiration',
      responsive: ['sm'],
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      responsive: ['sm'],
    },
    {
      title: 'Signature',
      dataIndex: 'signature',
      key: 'author',
      responsive: ['sm'],
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      responsive: ['sm'],
    },
    {
      title: <StarOutlined />,
      dataIndex: 'stars',
      key: 'stars',
      responsive: ['sm'],
    },
    {
      dataIndex: 'tuneId',
      fixed: 'right',
      render: (tuneId: string) => (
        <Space>
          {isClipboardSupported && <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(buildFullUrl([tunePath(tuneId)]))} />}
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate(tunePath(tuneId))} />
        </Space>
      ),
      key: 'tuneId',
    },
  ];

  return (
    <div className="large-container">
      <Input
        // eslint-disable-next-line jsx-a11y/tabindex-no-positive
        tabIndex={1}
        ref={searchRef}
        style={{ marginBottom: 10, height: 40 }}
        value={searchQuery}
        placeholder="Search..."
        onChange={({ target }) => debounceLoadData(target.value)}
        allowClear
      />
      <Table
        dataSource={dataSource}
        columns={columns}
        loading={isLoading}
        scroll={xs ? undefined : { x: 1360 }}
        pagination={false}
        rowClassName={(tune) => tune.visibility}
      />
      <div style={{ textAlign: 'right' }}>
        <Pagination
          style={{ marginTop: 10 }}
          pageSize={pageSize}
          current={page}
          total={total}
          onChange={(newPage, newPageSize) => {
            setIsLoading(true);
            setPage(newPage);
            setPageSize(newPageSize);
          }}
        />
      </div>
    </div>
  );
};

export default Hub;
