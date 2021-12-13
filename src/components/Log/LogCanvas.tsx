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
  zoom,
  zoomTransform,
  select,
  ZoomTransform,
} from 'd3';
import { seriesCanvasLine } from 'd3fc';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomState, setZoomState] = useState<ZoomTransform | null>(null);

  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const fieldsOnly = (entry: LogEntry) => entry.type === 'field';

  const filtered = useMemo(() => data.filter(fieldsOnly), [data]);

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

  const xValue = useCallback((entry: LogEntry): number => (entry.Time || 0) as number, []);
  const yValue = useCallback((entry: LogEntry, field: SelectedField): number => {
    if (!(field.label in entry)) {
      console.error(`Field [${field.label}] doesn't exist in this log file.`);
      return 0;
    }

    return entry[field.label] as number;
  }, []);

  const xScale = useMemo(() => {
    const tempXScale = scaleLinear()
      .domain([0, max(filtered, xValue) as number])
      .range([0, width]);
    let newXScale = tempXScale;

    if (zoomState) {
      newXScale = zoomState.rescaleX(tempXScale);
      tempXScale.domain(newXScale.domain());
    }

    return newXScale;
  }, [filtered, width, xValue, zoomState]);

  useEffect(() => {
    const canvas = select(canvasRef.current);
    const context = (canvas.node() as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;

    context.clearRect(0, 0, width, height);
    context.lineWidth = 2;

    const linesRaw = () => selectedFields.forEach((field, index) => {
      const yScale = (() => {
        const yField = (fieldsToPlot || {})[field.label] || { min: 0, max: 0 };

        return scaleLinear()
          .domain([yField.min, yField.max])
          .range([height, 0]);
      })();

      seriesCanvasLine()
        .xScale(xScale)
        .yScale(yScale)
        .crossValue((entry: LogEntry) => xValue(entry))
        .mainValue((entry: LogEntry) => yValue(entry, field))
        .context(context)
        // eslint-disable-next-line no-return-assign
        .decorate((ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = hsl(index, selectedFields.length);
        })(filtered);
    });

    const zoomed = () => setZoomState(zoomTransform(canvas.node() as any));

    const zoomBehavior = zoom()
      .scaleExtent([1, 1000])  // zoom boundaries
      .translateExtent([[0, 0], [width, height]]) // pan boundaries
      .extent([[0, 0], [width, height]])
      .on('zoom', zoomed);

    canvas.call(zoomBehavior as any);

    linesRaw();
  }, [data, fieldsToPlot, filtered, height, hsl, selectedFields, width, xScale, xValue, yValue]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
    />
  );
};

export default LogCanvas;
