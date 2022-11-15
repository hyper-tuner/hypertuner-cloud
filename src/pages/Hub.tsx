import { Link } from 'react-router-dom';
import {
  Button,
  Grid,
  Input,
  InputRef,
  Pagination,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/lib/table';
import {
  CopyOutlined,
  StarFilled,
  ArrowRightOutlined,
  EditOutlined,
  CheckCircleFilled,
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
import { formatTime } from '../utils/time';
import { useAuth } from '../contexts/AuthContext';
import {
  TunesResponse,
  UsersResponse,
} from '../@types/pocketbase-types';

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_ROOT, { tuneId });

const Hub = () => {
  const { xs } = useBreakpoint();
  const { searchTunes } = useDb();
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<TunesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const searchRef = useRef<InputRef | null>(null);
  const { currentUser } = useAuth();
  const goToEdit = (tuneId: string) => navigate(generatePath(Routes.UPLOAD_WITH_TUNE_ID, {
    tuneId,
  }));

  const loadData = debounce(async (searchText: string) => {
    setIsLoading(true);
    try {
      const { items, totalItems } = await searchTunes(searchText, page, pageSize);
      setTotal(totalItems);
      const mapped = items.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        authorUsername: (tune.expand!.author as unknown as UsersResponse).username,
        displacement: `${tune.displacement}l`,
        aspiration: aspirationMapper[tune.aspiration],
        updated: formatTime(tune.updated),
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

  const tagComponent = (tag: string) => (
    <Tag color={tag === 'base map' ? 'green' : 'red'}>
      {tag}
    </Tag>
  );

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
      render: (tune: TunesResponse) => (
        <>
          <Title level={5}>
            <Space>
              {tune.vehicleName}
              {tune.tags && tagComponent(tune.tags)}
            </Space>
          </Title>
          <Space direction="vertical">
            <Text type="secondary">
              <Link to={generatePath(Routes.USER_ROOT, { userId: tune.author })}>
                <Space>
                  {(tune.expand?.author as unknown as UsersResponse).verifiedAuthor === true && (
                    <Tooltip title="Verified author"><CheckCircleFilled /></Tooltip>
                  )}
                  {(tune as any).authorUsername}
                </Space>
              </Link>, {tune.updated}, {tune.stars} <StarFilled />
            </Text>
            <Text>{tune.engineMake}, {tune.engineCode}, {tune.displacement}, {tune.cylindersCount} cylinders, {tune.aspiration}</Text>
            <Text italic>{tune.signature}</Text>
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
      render: (vehicleName: string, tune: TunesResponse) => (
        <Space direction="vertical">
          {vehicleName}
          {tune.tags && tagComponent(tune.tags)}
        </Space>
      ),
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
      dataIndex: 'authorUsername',
      key: 'authorUsername',
      responsive: ['sm'],
      render: (userName: string, record: TunesResponse) => (
        <Link to={generatePath(Routes.USER_ROOT, { userId: record.author })}>
          <Space>
            {(record.expand?.author as unknown as UsersResponse).verifiedAuthor === true && (
              <Tooltip title="Verified author"><CheckCircleFilled /></Tooltip>
            )}
            {userName}
          </Space>
        </Link>
      ),
    },
    {
      title: 'Signature',
      dataIndex: 'signature',
      key: 'author',
      responsive: ['sm'],
      render: (signature: string) => (
        <Text italic>{signature}</Text>
      ),
    },
    {
      title: 'Published',
      dataIndex: 'updated',
      key: 'updated',
      responsive: ['sm'],
    },
    {
      title: <StarFilled />,
      dataIndex: 'stars',
      key: 'stars',
      width: 60,
      responsive: ['sm'],
    },
    {
      dataIndex: 'tuneId',
      fixed: 'right',
      render: (tuneId: string, record: TunesResponse) => {
        const isOwner = currentUser?.id === record.author;
        const size = isOwner ? 'small' : 'middle';

        return (
          <Space>
            {isOwner && (
              <Button
                size={size}
                icon={<EditOutlined />}
                onClick={() => goToEdit(tuneId)}
              />
            )}
            {isClipboardSupported && (
              <Button
                size={size}
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(buildFullUrl([tunePath(tuneId)]))}
              />
            )}
            <Button
              size={size}
              type="primary"
              icon={<ArrowRightOutlined />} onClick={() => navigate(tunePath(tuneId))}
            />
          </Space>
        );
      },
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
        placeholder="Search by anything..."
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
      <div style={{ textAlign: 'right', marginBottom: 10 }}>
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
