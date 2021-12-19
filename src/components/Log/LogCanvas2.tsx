import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Logs } from '@speedy-tuner/types';
import { Grid } from 'antd';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import { colorHsl } from '../../utils/number';
import LandscapeNotice from '../Dialog/LandscapeNotice';
import CanvasHelp from '../CanvasHelp';
import { Colors } from '../../utils/colors';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';

import 'uplot/dist/uPlot.min.css';
import { isNumber } from '../../utils/tune/expression';

const { useBreakpoint } = Grid;

export interface SelectedField {
  name: string;
  label: string;
  units: string;
  scale: string | number;
  transform: string | number;
  format: string;
};

interface Props {
  data: Logs;
  width: number;
  height: number;
  selectedFields: SelectedField[];
};

export interface PlottableField {
  min: number;
  max: number;
  scale: number;
  transform: number;
  units: string;
  format: string;
};

const LogCanvas2 = ({ data, width, height, selectedFields }: Props) => {
  const { sm } = useBreakpoint();
  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();

  const fieldsToPlot = useMemo(() => {
    const temp: { [index: string]: PlottableField } = {};

    data.forEach((entry) => {
      selectedFields.forEach(({ label, scale, transform, units, format }) => {
        const value = entry[label];

        if (!temp[label]) {
          temp[label] = {
            min: 0,
            max: 0,
            scale: (scale || 1) as number,
            transform: (transform || 0) as number,
            units: units || '',
            format: format || '',
          };
        }

        if (value > temp[label].max) {
          temp[label].max = entry[label] as number;
        }

        if (value < temp[label].min) {
          temp[label].min = entry[label] as number;
        }
      });
    });

    return temp;
  }, [data, selectedFields]);

  useEffect(() => {
    const dataSeries: uPlot.Series[] = [];
    const xData: number[] = [];
    const yData: (number | null)[][] = [];

    Object.keys(fieldsToPlot).forEach((label, index) => {
      const field = fieldsToPlot[label];

      dataSeries.push({
        label: field.units ? `${label} (${field.units})` : label,
        points: { show: false },
        stroke: hsl(index, selectedFields.length),
        scale: field.units,
        width: 2,
        value: (_self, val) => isNumber(val) ? val.toFixed(2) : 0,
      });

      data.forEach((entry) => {
        if (entry.type !== 'marker') {
          xData.push(entry.Time as number);

          let value = entry[label];

          if (value !== undefined) {
            value = (value as number * field.scale) + field.transform;
          }

          if (!yData[index]) {
            yData[index] = [];
          }

          yData[index].push(value);
        }
      });
    });

    setPlotData([
      xData,
      ...yData,
    ]);

    setOptions({
      width,
      height,
      scales: {
        x: { time: false },
      },
      series: [
        { label: 'Time (s)' },
        ...dataSeries,
      ],
      axes: [
        {
          stroke: Colors.TEXT,
          grid: { stroke: Colors.MAIN_LIGHT },
        },
      ],
      cursor: {
        drag: { y: false },
      },
      plugins: [touchZoomPlugin()],
    });

  }, [data, fieldsToPlot, hsl, selectedFields, width, height, sm]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <>
      <CanvasHelp />
      <UplotReact
        options={options!}
        data={plotData!}
      />
    </>
  );
};

export default LogCanvas2;
