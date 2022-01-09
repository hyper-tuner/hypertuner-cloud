import {
  useEffect,
  useState,
} from 'react';
import { Grid } from 'antd';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
import LandscapeNotice from '../Tune/Dialog/LandscapeNotice';
import { CompositeLogEntry } from '../../utils/logs/TriggerLogsParser';
import { Colors } from '../../utils/colors';

const { useBreakpoint } = Grid;

const scale = 2;
const secondaryTranslate = 2.6;
const primaryTranslate = 1;

interface Props {
  data: CompositeLogEntry[];
  width: number;
  height: number;
};

const CompositeCanvas = ({ data, width, height }: Props) => {
  const { sm } = useBreakpoint();
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();

  useEffect(() => {
    const xData: number[] = [];
    const secondary: (number | null)[] = [];
    const primary: (number | null)[] = [];
    const sync: (number | null)[] = [];

    data.forEach((entry, index) => {
      const prevSecondary = data[index - 1] ? data[index - 1].secondaryLevel : 0;
      const currentSecondary = (entry.secondaryLevel + secondaryTranslate) * scale;

      const prevPrimary = data[index - 1] ? data[index - 1].primaryLevel : 0;
      const currentPrimary = (entry.primaryLevel + primaryTranslate) * scale;

      const prevSync = data[index - 1] ? data[index - 1].sync : 0;
      const currentSync = entry.sync;

      // base data
      xData.push(index);
      secondary.push(currentSecondary);
      primary.push(currentPrimary);
      sync.push(currentSync);

      // make it square
      if (prevSecondary !== currentSecondary || prevPrimary !== currentPrimary || prevSync !== currentSync) {
        secondary.push(currentSecondary);
        primary.push(currentPrimary);
        sync.push(currentSync);
        xData.push(index + 1);
      }
    });

    setPlotData([
      xData,
      [...secondary],
      [...primary],
      [...sync],
    ]);

    setOptions({
      width,
      height,
      scales: {
        x: { time: false },
      },
      series: [
        { label: 'Event' },
        {
          label: 'Secondary',
          points: { show: false },
          stroke: Colors.GREEN,
          scale: '',
          value: (_self, rawValue) => (rawValue / scale) - secondaryTranslate,
          width: 2,
        },
        {
          label: 'Primary',
          points: { show: false },
          stroke: Colors.BLUE,
          scale: '',
          value: (_self, rawValue) => (rawValue / scale) - primaryTranslate,
          width: 2,
        },
        {
          label: 'Sync',
          points: { show: false },
          stroke: Colors.RED,
          scale: '',
          width: 2,
        },
      ],
      axes: [
        {
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

export default CompositeCanvas;
