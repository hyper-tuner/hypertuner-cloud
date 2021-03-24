import { useCallback, useEffect, useRef, useState } from 'react';

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

const Canvas = ({ data }: {  data: LogEntry[] }) => {
  const [zoomX, setZoomX] = useState(1);
  const [pan, setPan] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>();

  const plot = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    // const start = pan < 0 ? 0 : pan;
    const start = pan;

    const plotEntry = (field: string, yScale: number, color: string) => {
      const lastEntry = data[data.length - 1];
      const firstEntry = data[0];
      const maxTime = lastEntry.Time / (zoomX < 1 ? 1 : zoomX);
      const xScale = canvas.width / maxTime;

      ctx.strokeStyle = color;
      ctx.beginPath();

      // initial value
      ctx.moveTo(start + firstEntry.Time, canvas.height - (firstEntry[field] * yScale));

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

      const middle = canvas.width / 2;
      ctx.moveTo(middle, 0);
      ctx.lineTo(middle, canvas.height);
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
  }, [data, zoomX, pan]);

  const onWheel = (e: WheelEvent) => {
    setZoomX((current) => current < 1 ? 1 : current - e.deltaY / 100);
    // setPan((current) => current < 0 ? 0 : current - e.deltaX);
    setPan((current) => current - e.deltaX);
  };

  useEffect(() => {
    plot();
  }, [plot]);

  return (
    <canvas
      ref={canvasRef as any}
      id="plot"
      width="1200px"
      height="600px"
      style={{
        border: 'solid #222',
      }}
      onWheel={onWheel as any}
    />
  );
};

export default Canvas;
