import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Logs } from '@hyper-tuner/types';
import {
  Grid,
  Space,
} from 'antd';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import {
  colorHsl,
  formatNumber,
} from '../../utils/numbers';
import LandscapeNotice from '../Tune/Dialog/LandscapeNotice';
import { Colors } from '../../utils/colors';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
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
  selectedFields1: SelectedField[];
  selectedFields2: SelectedField[];
  showSingleGraph: boolean;
};

export interface PlottableField {
  min: number;
  max: number;
  scale: number;
  transform: number;
  units: string;
  format: string;
};

const LogCanvas = ({ data, width, height, selectedFields1, selectedFields2, showSingleGraph }: Props) => {
  const { sm } = useBreakpoint();
  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);
  const [options1, setOptions1] = useState<uPlot.Options>();
  const [plotData1, setPlotData1] = useState<uPlot.AlignedData>();
  const [options2, setOptions2] = useState<uPlot.Options>();
  const [plotData2, setPlotData2] = useState<uPlot.AlignedData>();

  const generateFieldsToPlot = useCallback((selectedFields: SelectedField[]) => {
    const temp: { [index: string]: PlottableField } = {};

    data.forEach((entry) => {
      selectedFields.forEach(({ label, scale, transform, units, format }) => {
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
      });
    });

    return temp;
  }, [data]);

  const generatePlotConfig = useCallback((fieldsToPlot: { [index: string]: PlottableField }, selectedFieldsLength: number, plotSyncKey: string) => {
    const dataSeries: uPlot.Series[] = [];
    const xData: number[] = [];
    const yData: (number | null)[][] = [];

    Object.keys(fieldsToPlot).forEach((label, index) => {
      const field = fieldsToPlot[label];

      dataSeries.push({
        label,
        points: { show: false },
        stroke: hsl(index, selectedFieldsLength),
        scale: field.units,
        width: 2,
        value: (_self, val) => `${(isNumber(val) ? formatNumber(val, field.format) : 0)}${field.units}`,
      });

      data.forEach((entry) => {
        // TODO: add type in MlgConverter
        if (entry.type === 'field') {
          // we only need to collect Time data once
          if (index === 0) {
            xData.push(entry.Time as number);
          }

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

    return {
      xData,
      yData,
      options: {
        width,
        height,
        scales: { x: { time: false } },
        series: [
          {
            label: 'Time',
            value: (_self: uPlot, val: number) => `${val.toLocaleString()}s`,
          },
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
          sync: { key: plotSyncKey },
          points: { size: 7 },
        },
        plugins: [touchZoomPlugin()],
      },
    };
  }, [data, height, hsl, width]);

  useEffect(() => {
    const plotSync = uPlot.sync('logs');

    if (selectedFields1.length > 0) {
      const result1 = generatePlotConfig(generateFieldsToPlot(selectedFields1), selectedFields1.length, plotSync.key);
      setOptions1(result1.options);
      setPlotData1([result1.xData, ...result1.yData]);
    }

    if (!showSingleGraph) {
      if (selectedFields2.length > 0) {
        const result2 = generatePlotConfig(generateFieldsToPlot(selectedFields2), selectedFields2.length, plotSync.key);
        setOptions2(result2.options);
        setPlotData2([result2.xData, ...result2.yData]);
      }
    }
  }, [data, hsl, width, height, sm, generatePlotConfig, generateFieldsToPlot, selectedFields1, selectedFields2, showSingleGraph]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <Space direction="vertical" size="large">
      <UplotReact options={options1!} data={plotData1!} />
      {!showSingleGraph && <UplotReact options={options2!} data={plotData2!} />}
    </Space>
  );
};

export default LogCanvas;
