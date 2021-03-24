import {
  useEffect,
  useRef,
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

interface LogEntry {
  [id: string]: number
}

enum Colors {
  RED = '#f32450',
  CYAN = '#8dd3c7',
  YELLOW = '#ffff00',
  PURPLE = '#bebada',
  GREEN = '#77de3c',
  BLUE = '#2fe3ff',
  GREY = '#334455',
  WHITE = '#fff',
}

const Log = () => {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<any>();
  const [logs, setLogs] = useState<ParserResult>();

  const plot = (canvas: HTMLCanvasElement, entries: LogEntry[]) => {
    const ctx = canvas.getContext('2d')!;
    // const start = canvas.width / 2;
    const start = 0;

    const plotEntry = (field: string, yScale: number, color: string) => {
      const lastEntry = entries[entries.length - 1];
      const firstEntry = entries[0];
      const maxTime = lastEntry.Time;
      const xScale = canvas.width / maxTime;

      ctx.strokeStyle = color;
      ctx.beginPath();

      // initial value
      ctx.moveTo(start + firstEntry.Time, canvas.height - (firstEntry[field] * yScale));

      entries.forEach((entry) => {
        const time = entry.Time * xScale; // scale time to max width
        const value = canvas.height - (entry[field] * yScale); // scale the value

        ctx.lineTo(start + time, value);
      });

      ctx.stroke();
    };
    const plotIndicator = () => {
      ctx.setLineDash([5]);
      ctx.strokeStyle = Colors.WHITE;
      ctx.beginPath();

      ctx.moveTo(start, 0);
      ctx.lineTo(start, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    ctx.lineWidth = Math.max(1.25, canvas.height / 400);

    plotIndicator();
    plotEntry('RPM', 0.09, Colors.RED);
    plotEntry('TPS', 7, Colors.BLUE);
    plotEntry('AFR Target', 5, Colors.YELLOW);
    plotEntry('AFR', 5, Colors.GREEN);
    plotEntry('MAP', 5, Colors.GREY);
  };

  useEffect(() => {
    loadLogs()
      .then((data) => {
        setIsLoading(true);
        const parsed = new Parser(data).parse();
        setLogs(parsed);
        setIsLoading(false);
        console.log(parsed);

        plot(canvasRef.current!, parsed.records as any);
      });
  }, []);

  return (
    <div style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
      {isLoading ?
        <Spin size="large" />
        :
        <div>
          <canvas
            ref={canvasRef}
            id="plot"
            width="1200px"
            height="600px"
            style={{
              border: 'solid #222',
            }}
          />
        </div>
      }
    </div>
  );
};

export default Log;
