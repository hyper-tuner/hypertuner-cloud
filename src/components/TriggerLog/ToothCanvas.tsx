import {
  useEffect,
  useState,
} from 'react';
import { Grid } from 'antd';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
import LandscapeNotice from '../Dialog/LandscapeNotice';
import {
  ToothLogEntry,
  EntryType,
} from '../../utils/logs/TriggerLogsParser';
import { Colors } from '../../utils/colors';

import 'uplot/dist/uPlot.min.css';

const { useBreakpoint } = Grid;
const { bars } = uPlot.paths;

interface Props {
  data: ToothLogEntry[];
  width: number;
  height: number;
};

const ToothCanvas = ({ data, width, height }: Props) => {
  const { sm } = useBreakpoint();
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();

  useEffect(() => {
    const xData: number[] = [];
    const yData: (number | null)[] = [];

    data.forEach((entry: ToothLogEntry, index) => {
      if (entry.type === EntryType.TRIGGER) {
        yData.push(entry.toothTime);
        xData.push(index);
      }
    });

    setPlotData([xData, yData]);

    setOptions({
      width,
      height,
      scales: {
        x: { time: false },
      },
      series: [
        { label: 'Event' },
        {
          label: 'Tooth time',
          points: { show: false },
          stroke: Colors.ACCENT,
          fill: Colors.ACCENT,
          value: (_self, rawValue) => `${rawValue.toLocaleString()}μs`,
          paths: bars!({ size: [0.6, 100] }),
        },
      ],
      axes: [
        {
          stroke: Colors.TEXT,
          grid: { stroke: Colors.MAIN_LIGHT },
        },
        {
          label: '',
          stroke: Colors.TEXT,
          grid: { stroke: Colors.MAIN_LIGHT },
        },
      ],
      cursor: {
        drag: { y: false },
        points: { size: 7 },
      },
      plugins: [touchZoomPlugin()],
    });
  }, [data, width, height, sm]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <UplotReact options={options!} data={plotData!} />
  );
};

export default ToothCanvas;
