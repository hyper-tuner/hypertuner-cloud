import {
  useEffect,
  useState,
} from 'react';
import {
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import {
  Button,
  Divider,
  List,
  Pagination,
  Typography,
} from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Routes } from '../routes';
import { formatTime } from '../utils/time';
import useDb from '../hooks/useDb';
import { aspirationMapper } from '../utils/tune/mappers';
import {
  TunesRecordFull,
  UsersRecordFull,
} from '../types/dbData';

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const Profile = () => {
  const navigate = useNavigate();
  const route = useMatch(Routes.USER_ROOT);
  const { getUserTunes } = useDb();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isTunesLoading, setIsTunesLoading] = useState(false);
  const [tunesDataSource, setTunesDataSource] = useState<TunesRecordFull[]>([]);
  const [username, setUsername] = useState();

  const loadData = async () => {
    setIsTunesLoading(true);
    try {
      const { items, totalItems } = await getUserTunes(route?.params.userId!, page, pageSize);
      setTotal(totalItems);
      setUsername((items[0].expand.author as UsersRecordFull).username);
      const mapped = items.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        displacement: `${tune.displacement}l`,
        aspiration: aspirationMapper[tune.aspiration],
        published: formatTime(tune.updated),
      }));
      setTunesDataSource(mapped as any);
    } catch (error) {
      // request cancelled
    } finally {
      setIsTunesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="small-container">
      <Divider>{username ? `${username}'s tunes` : 'No tunes yet'}</Divider>
      <List
        dataSource={tunesDataSource}
        loading={isTunesLoading}
        renderItem={(tune) => (
          <List.Item
            actions={[
              <Button icon={<ArrowRightOutlined />} onClick={() => navigate(tunePath(tune.tuneId))} />,
            ]}
            className={tune.visibility}
          >
            <List.Item.Meta
              title={<>
                {tune.vehicleName} <Typography.Text code>{tune.signature}</Typography.Text>
              </>}
              description={<>
                {tune.engineMake}, {tune.engineCode}, {tune.displacement}, {tune.aspiration}
              </>}
            />
            <div>
              <Typography.Text italic>{tune.published}</Typography.Text>
            </div>
          </List.Item>
        )}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Pagination
              style={{ marginTop: 10 }}
              pageSize={pageSize}
              current={page}
              total={total}
              onChange={(newPage, newPageSize) => {
                setIsTunesLoading(true);
                setPage(newPage);
                setPageSize(newPageSize);
              }}
            />
          </div>
        }
      />
    </div>
  );
};

export default Profile;
