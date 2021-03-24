import {
  useEffect,
  useState,
} from 'react';
import {
  Spin,
} from 'antd';
import { Parser } from 'mlg-converter';
import { Result as ParserResult } from 'mlg-converter/dist/types';
import { loadLogs } from '../utils/api';
import Canvas, { LogEntry } from './Log/Canvas';

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

        // plot(parsed.records as any);
      });
  }, []);

  return (
    <div style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
      {isLoading ?
        <Spin size="large" />
        :
        <Canvas data={logs!.records as LogEntry[]} />
      }
    </div>
  );
};

export default Log;
