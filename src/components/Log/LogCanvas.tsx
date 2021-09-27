import {
  Logs,
  LogEntry,
} from '@speedy-tuner/types';
import {
  scaleLinear,
  max,
  extent,
  line,
} from 'd3';

export interface SelectedField {
  name: string;
  units: string;
  scale: string | number;
  transform: string | number;
  format: string;
};

enum Colors {
  RED = '#f32450',
  CYAN = '#8dd3c7',
  YELLOW = '#ffff00',
  PURPLE = '#bebada',
  GREEN = '#77de3c',
  BLUE = '#2fe3ff',
  GREY = '#334455',
  WHITE = '#fff',
  BG = '#222629',
}

interface Props {
  data: Logs;
  width: number;
  height: number;
  selectedFields: SelectedField[];
};

const LogCanvas = ({ data, width, height, selectedFields }: Props) => {
  const selectedField = selectedFields[0].name;

  const xValue = (entry: LogEntry): number => entry.Time as number;
  const yValue = (entry: LogEntry): number => entry[selectedField] as number;

  const xScale = scaleLinear()
    .domain([0, max(data, xValue) as number])
    .range([0, width]);

  const yScale = scaleLinear()
    .domain(extent(data, yValue) as [number, number])
    .range([height, 0])
    .nice();

  const onlyFields = (entry: LogEntry) => entry.type === 'field';

  const flatData: [number, number][] = data
    .filter(onlyFields)
    .map((entry) => [xValue(entry), yValue(entry)]);

  const field1 = line()
    .x((entry) => xScale(entry[0]))
    .y((entry) => yScale(entry[1]))(flatData);

  return (
    <svg width={width} height={height}>
      <g>
        <path d={field1 as string} fill="none" stroke={Colors.RED} />
      </g>
    </svg>
  );
};

export default LogCanvas;
