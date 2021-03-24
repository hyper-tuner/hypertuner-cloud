import {
  useEffect,
  useState,
} from 'react';
import {
  Col,
  Row,
  Spin,
} from 'antd';
import { Parser } from 'mlg-converter';
import { Result as ParserResult } from 'mlg-converter/dist/types';
import { loadLogs } from '../utils/api';

const Log = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<ParserResult>();

  useEffect(() => {
    loadLogs()
      .then((data) => {
        setIsLoading(true);
        const parsed = new Parser(data).parse();
        setLogs(parsed);
        setIsLoading(false);
        console.log(parsed);
      });
  }, []);

  return (
    <Row gutter={20}>
      <Col span={8} />
      <Col span={8} style={{ textAlign: 'center', marginTop: 100 }}>
        {isLoading && <Spin size="large" />}
      </Col>
      <Col span={8} />
    </Row>
  );
};

export default Log;
