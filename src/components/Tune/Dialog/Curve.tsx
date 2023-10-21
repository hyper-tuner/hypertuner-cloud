import { Grid, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { Colors } from '../../../utils/colors';
import Table from './Curve/Table';
import LandscapeNotice from './LandscapeNotice';

const { useBreakpoint } = Grid;

const Curve = ({
  xLabel,
  yLabel,
  xData,
  yData,
  help,
  xUnits = '',
  yUnits = '',
}: {
  xLabel: string;
  yLabel: string;
  xData: number[];
  yData: number[];
  help?: string;
  xUnits?: string;
  yUnits?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { sm } = useBreakpoint();
  const [options, setOptions] = useState<uPlot.Options>();
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();
  const [canvasWidth, setCanvasWidth] = useState(0);

  const calculateWidth = useCallback(() => {
    setCanvasWidth(containerRef.current?.clientWidth || 0);
  }, []);

  useEffect(() => {
    setPlotData([xData, yData]);
    setOptions({
      width: canvasWidth,
      height: 350,
      scales: {
        x: { time: false },
      },
      series: [
        {
          label: xLabel,
          value: (_self, val) => (val ? `${val.toLocaleString()}${xUnits}` : ''),
        },
        {
          label: yLabel,
          value: (_self, val) => (val ? `${val.toLocaleString()}${yUnits}` : ''),
          points: { show: true },
          stroke: Colors.ACCENT,
          width: 3,
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
        drag: { y: false, x: false },
        points: { size: 9 },
      },
    });

    calculateWidth();
    window.addEventListener('resize', calculateWidth);

    return () => {
      window.removeEventListener('resize', calculateWidth);
    };
  }, [xData, xLabel, xUnits, yData, yLabel, yUnits, sm, canvasWidth, calculateWidth]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <>
      {help && (
        <Typography.Paragraph>
          <Typography.Text type="secondary">{help}</Typography.Text>
        </Typography.Paragraph>
      )}
      <UplotReact options={options!} data={plotData!} />
      <div ref={containerRef}>
        <Table
          xLabel={xLabel}
          yLabel={yLabel}
          xData={xData}
          yData={yData}
          xUnits={xUnits}
          yUnits={yUnits}
        />
      </div>
    </>
  );
};

export default Curve;
