import { useEffect, useState } from 'react';
import { generatePath, useMatch, useNavigate } from 'react-router-dom';
import { Button, Divider, List, Pagination, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Routes } from '../routes';
import { formatTime } from '../utils/time';
import useDb from '../hooks/useDb';
import { aspirationMapper } from '../utils/tune/mappers';
import { TunesResponse, UsersResponse } from '../@types/pocketbase-types';
import TuneTag from '../components/TuneTag';
import AuthorName from '../components/AuthorName';

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const Profile = () => {
  const navigate = useNavigate();
  const route = useMatch(Routes.USER_ROOT);
  const { getUserTunes } = useDb();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isTunesLoading, setIsTunesLoading] = useState(false);
  const [tunesDataSource, setTunesDataSource] = useState<TunesResponse[]>([]);
  const [author, setAuthor] = useState<UsersResponse>();

  const loadData = async () => {
    setIsTunesLoading(true);
    try {
      const { items, totalItems } = await getUserTunes(route?.params.userId!, page, pageSize);
      setTotal(totalItems);
      setAuthor(items[0]!.expand!.author);
      const mapped = items.map((tune) => ({
        ...tune,
        key: tune.tuneId,
        year: tune.year,
        displacement: `${tune.displacement}l`,
        aspiration: aspirationMapper[tune.aspiration],
        updated: formatTime(tune.updated),
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
  }, [page]);

  return (
    <div className="small-container">
      <Divider>
        {author ? (
          <>
            <AuthorName author={author} />
            <span>&apos; tunes</span>
          </>
        ) : (
          'No tunes yet'
        )}
      </Divider>
      <List
        dataSource={tunesDataSource}
        loading={isTunesLoading}
        renderItem={(tune) => (
          <List.Item
            actions={[
              <Button
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(tunePath(tune.tuneId))}
              />,
            ]}
            className={tune.visibility}
          >
            <Space direction="vertical">
              <List.Item.Meta
                title={
                  <Space direction="vertical">
                    {tune.vehicleName}
                    <TuneTag tag={tune.tags} />
                    <Typography.Text italic={true}>{tune.signature}</Typography.Text>
                  </Space>
                }
                description={
                  <>
                    {tune.engineMake}, {tune.engineCode}, {tune.displacement}, {tune.aspiration}
                  </>
                }
              />
              <div>
                <Typography.Text italic={true}>{tune.updated}</Typography.Text>
              </div>
            </Space>
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
