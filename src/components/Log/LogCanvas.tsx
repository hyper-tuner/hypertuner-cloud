import {
  Logs,
  LogEntry,
} from '@speedy-tuner/types';
import {
  scaleLinear,
  max,
  line,
} from 'd3';
import {
  useCallback,
  useMemo,
} from 'react';
import { colorHsl } from '../../utils/number';

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
  color: string;
};

const MAX_FIELDS = 5;

const LogCanvas = ({ data, width, height, selectedFields }: Props) => {
  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const xValue = (entry: LogEntry): number => (entry.Time || 0) as number;
  const yValue = (entry: LogEntry, field: SelectedField): number => {
    if (!(field.label in entry)) {
      console.error(`Field [${field.label}] doesn't exist in this log file.`);
      return 0;
    }

    return entry[field.label] as number;
  };

  const xScale = useMemo(() => scaleLinear()
    .domain([0, max(data, xValue) as number])
    .range([0, width]), [data, width]);

  const fieldsOnly = (entry: LogEntry) => entry.type === 'field';

  const filtered = useMemo(() => data.filter(fieldsOnly), [data]);;

  // find max values for each selected field so we can calculate scale
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
            color: hsl(index, MAX_FIELDS),
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
  }, [filtered, hsl, selectedFields]);


  const lines = useCallback(() => selectedFields.map((field) => {
    const yField = fieldsToPlot[field.label];

    const yScale = scaleLinear()
      .domain([yField.min, yField.max])
      .range([height, 0]);

    return line()
      .x((entry) => xScale(xValue(entry as any)))
      .y((entry) => yScale(yValue(entry as any, field)))(filtered as any) as string;
  }), [fieldsToPlot, filtered, height, selectedFields, xScale]);

  return (
    <svg width={width} height={height}>
      <g>
        {data.length && lines().map((field, index) => (
          <path
            key={selectedFields[index].name}
            d={field}
            fill="none"
            stroke={fieldsToPlot[selectedFields[index].label].color}
          />))}
      </g>
    </svg>
  );
};

export default LogCanvas;
