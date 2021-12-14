import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Logs,
  LogEntry,
} from '@speedy-tuner/types';
import TimeChart from 'timechart';
import { colorHsl } from '../../utils/number';

// enum Colors {
//   RED = '#f32450',
//   CYAN = '#8dd3c7',
//   YELLOW = '#ffff00',
//   PURPLE = '#bebada',
//   GREEN = '#77de3c',
//   BLUE = '#2fe3ff',
//   GREY = '#334455',
//   WHITE = '#fff',
//   BG = '#222629',
// }

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

const LogCanvas = ({ data, width, height, selectedFields }: Props) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const fieldsOnly = (entry: LogEntry) => entry.type === 'field';

  const filtered = useMemo(() => data.filter(fieldsOnly), [data]);

  // find max values for each selected field so we can calculate scale
  // TODO: unused
  const fieldsToPlot = useMemo(() => {
    const temp: { [index: string]: PlottableField } = {};

    filtered.forEach((entry) => {
      selectedFields.forEach(({ label, scale, transform, units, format }, index) => {
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
  }, [filtered, selectedFields]);

  useEffect(() => {
    const series = selectedFields.map((field) => ({
      name: field.label,
      color: hsl(selectedFields.indexOf(field), selectedFields.length),
      data: data.map((entry) => ({
        x: entry.Time as number,
        y: entry[field.label] as number,
      })).filter((entry) => entry.x !== undefined || entry.y !== undefined),
    }));

    const chart = new TimeChart(canvasRef.current!, {
      series,
      lineWidth: 2,
      tooltip: true,
      legend: false,
      zoom: {
        x: { autoRange: true },
        y: { autoRange: true },
      },
    });

    return () => chart.dispose();
  }, [data, fieldsToPlot, filtered, hsl, selectedFields, width, height]);

  return (
    <div
      ref={canvasRef}
      style={{ width, height }}
      className="log-canvas"
    />
  );
};

export default LogCanvas;
