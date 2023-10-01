import { useEffect, useState } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { Colors } from '../../utils/colors';
import { CompositeLogEntry } from '../../utils/logs/TriggerLogsParser';
import keyboardZoomPanPlugin from '../../utils/uPlot/keyboardZoomPanPlugin';
import mouseZoomPlugin from '../../utils/uPlot/mouseZoomPlugin';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
import LogsPagination from './LogsPagination';

const scale = 2;
const secondaryTranslate = 2.6;
const primaryTranslate = 1;

const PAGE_SIZE = 200;

interface Props {
  data: CompositeLogEntry[];
  width: number;
  height: number;
}

const CompositeCanvas = ({ data, width, height }: Props) => {
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();
  const [indexFrom, setIndexFrom] = useState(0);
  const [indexTo, setIndexTo] = useState(PAGE_SIZE);

  useEffect(() => {
    const xData: number[] = [];
    const secondary: (number | null)[] = [];
    const primary: (number | null)[] = [];
    const sync: (number | null)[] = [];

    data.slice(indexFrom, indexTo).forEach((entry, index) => {
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
      if (
        prevSecondary !== currentSecondary ||
        prevPrimary !== currentPrimary ||
        prevSync !== currentSync
      ) {
        secondary.push(currentSecondary);
        primary.push(currentPrimary);
        sync.push(currentSync);
        xData.push(index + 1);
      }
    });

    setPlotData([xData, [...secondary], [...primary], [...sync]]);

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
          value: (_self, rawValue) => rawValue / scale - secondaryTranslate,
          width: 2,
        },
        {
          label: 'Primary',
          points: { show: false },
          stroke: Colors.BLUE,
          scale: '',
          value: (_self, rawValue) => rawValue / scale - primaryTranslate,
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
      plugins: [touchZoomPlugin(), mouseZoomPlugin(), keyboardZoomPanPlugin()],
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

export default CompositeCanvas;
