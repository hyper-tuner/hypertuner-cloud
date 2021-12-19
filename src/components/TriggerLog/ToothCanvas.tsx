import {
  useEffect,
  useRef,
} from 'react';
import { Grid } from 'antd';
import LandscapeNotice from '../Dialog/LandscapeNotice';
import { ToothLogEntry } from '../../utils/logs/TriggerLogsParser';
import CanvasHelp from '../CanvasHelp';

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

const { useBreakpoint } = Grid;

interface Props {
  data: ToothLogEntry[];
  width: number;
  height: number;
};

const ToothCanvas = ({ data, width, height }: Props) => {
  const { sm } = useBreakpoint();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

  }, [data, width, height, sm]);

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <>
      <CanvasHelp />
      <div
        ref={canvasRef}
        style={{ width, height }}
        className="log-canvas"
      />
    </>
  );
};

export default ToothCanvas;
