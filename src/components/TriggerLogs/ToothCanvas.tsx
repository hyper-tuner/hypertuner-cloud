import {
  useEffect,
  useState,
} from 'react';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
import {
  ToothLogEntry,
  EntryType,
} from '../../utils/logs/TriggerLogsParser';
import { Colors } from '../../utils/colors';
import LogsPagination from './LogsPagination';

const { bars } = uPlot.paths;

interface Props {
  data: ToothLogEntry[];
  width: number;
  height: number;
};

const PAGE_SIZE = 200;

const ToothCanvas = ({ data, width, height }: Props) => {
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();
  const [indexFrom, setIndexFrom] = useState(0);
  const [indexTo, setIndexTo] = useState(PAGE_SIZE);

  useEffect(() => {
    const xData: number[] = [];
    const yData: (number | null)[] = [];

    data
      .slice(indexFrom, indexTo)
      .forEach((entry: ToothLogEntry, index) => {
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
          stroke: Colors.PRIMARY,
          fill: Colors.PRIMARY,
          value: (_self, rawValue) => `${rawValue.toLocaleString()}μs`,
          paths: bars!({ size: [0.6, 100] }),
          scale: 'toothTime',
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
          scale: 'toothTime',
        },
      ],
      cursor: {
        drag: { y: false },
        points: { size: 7 },
      },
      plugins: [touchZoomPlugin()],
    });
  }, [data, width, height, indexFrom, indexTo]);

  return (
    <LogsPagination
      onChange={(newIndexFrom, newIndexTo) => {
        setIndexFrom(newIndexFrom);
        setIndexTo(newIndexTo);
      }}
      pageSize={PAGE_SIZE}
      total={data.length}
    >
      {plotData && <UplotReact options={options!} data={plotData} />}
    </LogsPagination>
  );
};

export default ToothCanvas;
