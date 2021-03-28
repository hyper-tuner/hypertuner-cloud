import {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent,
  WheelEvent,
  TouchEvent,
  Touch,
} from 'react';

export interface LogEntry {
  [id: string]: number
}

enum Colors {
  RED = '#f32450',
  CYAN = '#8dd3c7',
  YELLOW = '#ffff00',
  PURPLE = '#bebada',
  GREEN = '#77de3c',
  BLUE = '#2fe3ff',
  GREY = '#334455',
  WHITE = '#fff',
}

const Canvas = ({ data }: { data: LogEntry[] }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [indicatorPos, setIndicatorPos] = useState(0);
  const [previousTouch, setPreviousTouch] = useState<Touch | null>(null);
  const leftBoundary = 0;
  const [rightBoundary, setRightBoundary] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>();
  const checkPan = (current: number, value: number) => {
    if (current > leftBoundary) {
      return leftBoundary;
    }
    if (current < rightBoundary) {
      return rightBoundary;
    }
    return value;
  };

  const plot = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const lastEntry = data[data.length - 1];
    const maxTime = lastEntry.Time / (zoom < 1 ? 1 : zoom);
    const xScale = canvas.width / maxTime;
    const firstEntry = data[0];
    const scaledWidth = canvas.width * zoom / 1;
    const start = pan;
    setRightBoundary(-(scaledWidth - canvas.width));

    if (zoom < 1) {
      setZoom(1);
      setPan(0);
      return;
    }

    if (pan > leftBoundary || pan < rightBoundary) {
      return;
    }

    const plotEntry = (field: string, yScale: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.beginPath();

      // initial value
      ctx.moveTo(start + firstEntry.Time, canvas.height - (firstEntry[field] * yScale));

      // TODO: slice array according to the visible part
      data.forEach((entry) => {
        const time = entry.Time * xScale; // scale time to max width
        const value = canvas.height - (entry[field] * yScale); // scale the value

        ctx.lineTo(start + time, value);
      });

      ctx.stroke();
    };

    const plotIndicator = () => {
      ctx.setLineDash([5]);
      ctx.strokeStyle = Colors.WHITE;
      ctx.beginPath();

      ctx.moveTo(indicatorPos, 0);
      ctx.lineTo(indicatorPos, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = Math.max(1.25, canvas.height / 400);

    plotIndicator();
    plotEntry('RPM', 0.16, Colors.RED);
    plotEntry('TPS', 20, Colors.BLUE);
    plotEntry('AFR Target', 4, Colors.YELLOW);
    plotEntry('AFR', 4, Colors.GREEN);
    plotEntry('MAP', 5, Colors.GREY);
  }, [data, zoom, pan, rightBoundary, indicatorPos]);

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      setZoom((current) => {
        if (current < 1) {
          setPan(0);
          return 1;
        }
        return current - e.deltaY / 100;
      });
    }
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      setPan((current) => checkPan(current, current - e.deltaX));
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    setIndicatorPos(e.nativeEvent.offsetX);
    if (isMouseDown) {
      setPan((current) => checkPan(current, current + e.movementX));
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (previousTouch) {
      (e as any).movementX = touch.pageX - previousTouch.pageX;
      (e as any).movementY = touch.pageY - previousTouch.pageY;
      setPan((current) => checkPan(current, current + (e as any).movementX));
    };

    setPreviousTouch(touch);
  };

  useEffect(() => {
    plot();
  }, [plot]);

  return (
    <canvas
      ref={canvasRef as any}
      className="plot"
      width="1200px"
      height="600px"
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onTouchStart={() => setPreviousTouch(null)}
    />
  );
};

export default Canvas;
