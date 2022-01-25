import {
  Badge,
  Card,
  Col,
  Row,
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
import { TuneDbData } from '../types/dbData';
import { Routes } from '../routes';
import { generateShareUrl } from '../utils/url';

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
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const goToTune = (tuneId: string) => navigate(generatePath(Routes.TUNE_ROOT, { tuneId }));

  const copyToClipboard = async (shareUrl: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // TODO: fix this

  return (
    <div style={containerStyle}>
      <Typography.Title>Hub</Typography.Title>
      <Row gutter={[16, 16]}>
        {tunes.length === 0 ? loadingCards : (
          tunes.map((tune) => (
            <Col span={16} sm={8} key={tune.tuneFile}>
              <Card
                title={tune.details!.model}
                actions={[
                  <Badge count={0} showZero size="small" color="gold">
                    <StarOutlined />
                  </Badge>,
                  <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                    <CopyOutlined onClick={() => copyToClipboard(generateShareUrl(tune.id!))} />
                  </Tooltip>,
                  <ArrowRightOutlined onClick={() => goToTune(tune.id!)} />,
                ]}
              >
                <Typography.Text ellipsis>
                  {tune.details!.make} {tune.details!.model} {tune.details!.year}
                </Typography.Text>
              </Card>
            </Col>
          )))}
      </Row>
    </div>
  );
};

export default Hub;
