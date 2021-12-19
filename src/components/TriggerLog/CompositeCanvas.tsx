import {
  useEffect,
  useRef,
} from 'react';
import { Grid } from 'antd';
import TimeChart from 'timechart';
import { EventsPlugin } from 'timechart/dist/lib/plugins_extra/events';
import LandscapeNotice from '../Dialog/LandscapeNotice';
import { CompositeLogEntry } from '../../utils/logs/TriggerLogsParser';
import CanvasHelp from '../CanvasHelp';

enum Colors {
  RED = '#f32450',
  CYAN = '#8dd3c7',
  YELLOW = '#ffff00',
  PURPLE = '#bebada',
  GREEN = '#77de3c',
  BLUE = '#2fe3ff',
  GREY = '#334455',
  WHITE = '#fff',
  BG = '#222629',
}

const { useBreakpoint } = Grid;

interface Props {
  data: CompositeLogEntry[];
  width: number;
  height: number;
};

interface DataPoint {
  x: number;
  y: number;
}

const CompositeCanvas = ({ data, width, height }: Props) => {
  const { sm } = useBreakpoint();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let chart: TimeChart;
    const markers: { x: number, name: string }[] = [];
    const primary: DataPoint[] = [];
    const secondary: DataPoint[] = [];
    const sync: DataPoint[] = [];

    data.forEach((entry, index) => {
      if (entry.type === 'marker') {
        markers.push({
          x: index,
          name: '',
        });
      }

      if (entry.type === 'trigger') {
        const prevSecondary = data[index - 1] ? data[index - 1].secondaryLevel : 0;
        const currentSecondary = (entry.secondaryLevel + 3) * 2; // apply scale

        const prevPrimary = data[index - 1] ? data[index - 1].primaryLevel : 0;
        const currentPrimary = (entry.primaryLevel + 1) * 2; // apply scale

        const prevSync = data[index - 1] ? data[index - 1].sync : 0;
        const currentSync = entry.sync;

        // make it square
        if (prevSecondary !== currentSecondary) {
          secondary.push({
            x: index - 1,
            y: currentSecondary,
          });
        }
        secondary.push({
          x: index,
          y: currentSecondary,
        });

        if (prevPrimary !== currentPrimary) {
          primary.push({
            x: index - 1,
            y: currentPrimary,
          });
        }
        primary.push({
          x: index,
          y: currentPrimary,
        });

        if (prevSync !== currentSync) {
          sync.push({
            x: index - 1,
            y: currentSync,
          });
        }
        sync.push({
          x: index,
          y: currentSync,
        });
      }
    });

    const series = [{
      name: 'Secondary',
      color: Colors.GREEN,
      data: secondary,
    }, {
      name: 'Primary',
      color: Colors.BLUE,
      data: primary,
    }, {
      name: 'Sync',
      color: Colors.RED,
      data: sync,
    }];

    if (canvasRef.current && sm) {
      chart = new TimeChart(canvasRef.current, {
        series,
        lineWidth: 2,
        tooltip: true,
        legend: false,
        zoom: {
          x: { autoRange: true },
        },
        yRange: { min: -1, max: 9 },
        tooltipXLabel: 'Event',
        plugins: {
          events: new EventsPlugin(markers),
        },
      });
    }

    return () => chart && chart.dispose();
  }, [data, width, height, sm]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <>
      <CanvasHelp />
      <div
        ref={canvasRef}
        style={{ width, height }}
        className="log-canvas"
      />
    </>
  );
};

export default CompositeCanvas;
