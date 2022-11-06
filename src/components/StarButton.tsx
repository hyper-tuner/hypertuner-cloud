import {
  useEffect,
  useState,
} from 'react';
import {
  Badge,
  Button,
  Space,
  Tooltip,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Colors } from '../utils/colors';
import { TuneDataState } from '../types/state';
import useDb from '../hooks/useDb';
import { useAuth } from '../contexts/AuthContext';
import { Routes } from '../routes';

const StarButton = ({ tuneData }: { tuneData: TuneDataState }) => {
  const navigate = useNavigate();
  const { currentUserToken } = useAuth();
  const { toggleStar, isStarredByMe } = useDb();
  const [currentStars, setCurrentStars] = useState(tuneData.stars);
  const [isCurrentlyStarred, setIsCurrentlyStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleStarClick = async () => {
    if (!currentUserToken) {
      navigate(Routes.LOGIN);

      return;
    }

    try {
      setIsLoading(true);
      const { stars, isStarred } = await toggleStar(currentUserToken, tuneData.id);
      setCurrentStars(stars);
      setIsCurrentlyStarred(isStarred);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUserToken) {
      setIsLoading(false);

      return;
    }

    setIsLoading(true);
    isStarredByMe(currentUserToken, tuneData.id).then((isStarred) => {
      setIsCurrentlyStarred(isStarred);
      setIsLoading(false);
    }).catch((error) => {
      setIsLoading(false);
      throw error;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserToken, tuneData.id]);

  return (
    <div style={{ textAlign: 'right' }}>
      <Tooltip
        title="You must be signed in to star a tune"
        placement="bottom"
        trigger={currentUserToken ? 'none' : 'hover'}
      >
        <Button
          icon={isCurrentlyStarred ? <StarFilled style={{ color: Colors.YELLOW }} /> : <StarOutlined />}
          onClick={toggleStarClick}
          loading={isLoading}
        >
          <Space style={{ marginLeft: 10 }}>
            <div>{isCurrentlyStarred ? 'Starred' : 'Star'}</div>
            <Badge
              count={currentStars}
              style={{ backgroundColor: Colors.TEXT, marginTop: -4 }}
              showZero
            />
          </Space>
        </Button>
      </Tooltip>
    </div>
  );
};

export default StarButton;



