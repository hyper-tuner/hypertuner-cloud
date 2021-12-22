import {
  Typography,
  Grid,
} from 'antd';
import {
  useEffect,
  useState,
} from 'react';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import touchZoomPlugin from '../../utils/uPlot/touchZoomPlugin';
import { Colors } from '../../utils/colors';
import LandscapeNotice from './LandscapeNotice';
import Table from './Table';

const { useBreakpoint } = Grid;

const Curve = ({
  name,
  width,
  xLabel,
  yLabel,
  xData,
  yData,
  disabled,
  help,
  xMin,
  xMax,
  yMin,
  yMax,
  xUnits = '',
  yUnits = '',
}: {
  name: string,
  width: number,
  xLabel: string,
  yLabel: string,
  xData: number[],
  yData: number[],
  disabled: boolean,
  help: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  xUnits?: string,
  yUnits?: string,
}) => {
  const { sm } = useBreakpoint();
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();

  useEffect(() => {
    setPlotData([xData, yData]);
    setOptions({
      width,
      height: 350,
      scales: {
        x: { time: false },
      },
      series: [
        {
          label: xLabel,
          value: (_self, val) => `${val.toLocaleString()}${xUnits}`,
        },
        {
          label: yLabel,
          value: (_self, val) => `${val.toLocaleString()}${yUnits}`,
          points: { show: false },
          stroke: Colors.ACCENT,
          width: 2,
        },
      ],
      axes: [
        {
          stroke: Colors.TEXT,
          grid: { stroke: Colors.MAIN_LIGHT },
        },
        {
          label: `${yLabel} (${yUnits})`,
          stroke: Colors.TEXT,
          grid: { stroke: Colors.MAIN_LIGHT },
        },
      ],
      cursor: {
        drag: { y: false },
        points: { size: 9 },
      },
      plugins: [touchZoomPlugin()],
    });
  }, [width, xData, xLabel, xUnits, yData, yLabel, yUnits]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <>
      <Typography.Paragraph>
        <Typography.Text type="secondary">{help}</Typography.Text>
      </Typography.Paragraph>
      <UplotReact options={options!} data={plotData!} />
      <Table
        name={name}
        key={name}
        xLabel={xLabel}
        yLabel={yLabel}
        xData={xData}
        yData={yData}
        disabled={disabled}
        xMin={xMin}
        xMax={xMax}
        yMin={yMin}
        yMax={yMax}
        xUnits={xUnits}
        yUnits={yUnits}
      />
    </>
  );
};

export default Curve;
