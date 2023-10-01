import { Logs } from '@hyper-tuner/types';
import { Space } from 'antd';
import { useCallback } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { Colors } from '../../utils/colors';
import { colorHsl, formatNumberMs } from '../../utils/numbers';
import { isNumber } from '../../utils/tune/expression';
import keyboardZoomPlugin from '../../utils/uPlot/keyboardZoomPlugin';
import mouseZoomPlugin from '../../utils/uPlot/mouseZoomPlugin';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';

export interface SelectedField {
  name: string;
  label: string;
  units: string;
  scale: string | number;
  transform: string | number;
  format: string;
}

interface LogCanvasProps {
  data: Logs;
  width: number;
  height: number;
  selectedFields1: SelectedField[];
  selectedFields2: SelectedField[];
  showSingleGraph: boolean;
}

export interface PlottableField {
  min: number;
  max: number;
  scale: number;
  transform: number;
  units: string;
  format: string;
}

const plotSync = uPlot.sync('logs');

const LogCanvas = ({
  data,
  width,
  height,
  selectedFields1,
  selectedFields2,
  showSingleGraph,
}: LogCanvasProps) => {
  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const generateFieldsToPlot = useCallback(
    (selectedFields: SelectedField[]) => {
      const temp: { [index: string]: PlottableField } = {};

      data.forEach((_entry) => {
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
    },
    [data],
  );

  const generatePlotConfig = useCallback(
    (
      fieldsToPlot: { [index: string]: PlottableField },
      selectedFieldsLength: number,
      plotSyncKey: string,
    ) => {
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
          value: (_self, val) =>
            `${isNumber(val) ? formatNumberMs(val, field.format) : 0}${field.units}`,
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
              value = (value as number) * field.scale + field.transform;
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
              value: (_self: uPlot, val: number) => (val ? `${val.toLocaleString()}s` : '0s'),
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
          plugins: [touchZoomPlugin(), mouseZoomPlugin(), keyboardZoomPlugin()],
        },
      };
    },
    [data, height, hsl, width],
  );

  const result1 = generatePlotConfig(
    generateFieldsToPlot(selectedFields1),
    selectedFields1.length,
    plotSync.key,
  );
  const options1: uPlot.Options = result1.options;
  const plotData1: uPlot.AlignedData = [result1.xData, ...result1.yData];

  let options2: uPlot.Options = {} as uPlot.Options;
  let plotData2: uPlot.AlignedData = [];

  if (!showSingleGraph) {
    const result2 = generatePlotConfig(
      generateFieldsToPlot(selectedFields2),
      selectedFields2.length,
      plotSync.key,
    );

    options2 = result2.options;
    plotData2 = [result2.xData, ...result2.yData];
  }

  return (
    <Space direction="vertical" size="large">
      <UplotReact key={`first-${selectedFields1.join('-')}`} options={options1} data={plotData1} />
      {!showSingleGraph && (
        <UplotReact
          key={`second-${selectedFields2.join('-')}`}
          options={options2}
          data={plotData2}
        />
      )}
    </Space>
  );
};

export default LogCanvas;
