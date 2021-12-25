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
import { Colors } from '../../utils/colors';
import LandscapeNotice from './LandscapeNotice';
import Table from './Curve/Table';

const { useBreakpoint } = Grid;

const Curve = ({
  width,
  xLabel,
  yLabel,
  xData,
  yData,
  disabled,
  help,
  xUnits = '',
  yUnits = '',
}: {
  width: number,
  xLabel: string,
  yLabel: string,
  xData: number[],
  yData: number[],
  disabled: boolean,
  help: string,
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
          points: { show: true },
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
    });
  }, [width, xData, xLabel, xUnits, yData, yLabel, yUnits, sm]);

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
        xLabel={xLabel}
        yLabel={yLabel}
        xData={xData}
        yData={yData}
        disabled={disabled}
        xUnits={xUnits}
        yUnits={yUnits}
      />
    </>
  );
};

export default Curve;
