import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Logs,
  LogEntry,
} from '@speedy-tuner/types';
import {
  scaleLinear,
  max,
  line,
  zoom,
  zoomTransform,
  select,
  ZoomTransform,
} from 'd3';
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoomState, setZoomState] = useState<ZoomTransform | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  // const [fieldsToPlot, setFieldsToPlot] = useState<{ [index: string]: PlottableField } | null>(null);

  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const fieldsOnly = (entry: LogEntry) => entry.type === 'field';

  const filtered = useMemo(() => data.filter(fieldsOnly), [data]);

  // find max values for each selected field so we can calculate scale
  const fieldsToPlot = useMemo(() => {
    console.log('calc!');

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

  const xValue = (entry: LogEntry): number => (entry.Time || 0) as number;
  const yValue = (entry: LogEntry, field: SelectedField): number => {
    if (!(field.label in entry)) {
      console.error(`Field [${field.label}] doesn't exist in this log file.`);
      return 0;
    }

    return entry[field.label] as number;
  };

  useEffect(() => {
    console.log('render :(');

    const xScale = scaleLinear()
      .domain([0, max(filtered, xValue) as number])
      .range([0, width]);

    if (zoomState) {
      const newXScale = zoomState.rescaleX(xScale);
      xScale.domain(newXScale.domain());
    }

    const linesRaw = () => selectedFields.map((field) => {
      const yField = (fieldsToPlot || {})[field.label] || { min: 0, max: 0 };

      const yScale = scaleLinear()
        .domain([yField.min, yField.max])
        .range([height, 0]);

      return line()
        .x((entry) => xScale(xValue(entry as any)))
        .y((entry) => yScale(yValue(entry as any, field)))(filtered as any) as string;
    });

    const svg = select(svgRef.current);

    const zoomed = () => setZoomState(zoomTransform(svg.node() as any));

    const zoomBehavior = zoom()
      .scaleExtent([1, 1000])  // zoom boundaries
      .translateExtent([[0, 0], [width, height]]) // pan boundaries
      .extent([[0, 0], [width, height]])
      .on('zoom', zoomed);

    svg.call(zoomBehavior as any);

    setLines(linesRaw());
  }, [data, fieldsToPlot, filtered, height, hsl, selectedFields, width, zoomState]);

  return (
    <svg width={width} height={height} ref={svgRef}>
      <g>
        {data.length ? lines.map((field, index) => (
          <path
            key={(selectedFields[index] || {}).name}
            d={field}
            fill="none"
            // stroke={(fieldsToPlot[selectedFields[index].label] || {}).color}
            stroke="red"
            strokeWidth={2}
          />)) : null}
      </g>
    </svg>
  );
};

export default LogCanvas;
