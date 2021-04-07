/* eslint-disable no-bitwise */

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
import {
  isDown,
  isLeft,
  isRight,
  isUp,
} from '../../utils/keyboard/shortcuts';
import {
  colorHsl,
  msToTime,
} from '../../utils/number';

export interface LogEntry {
  [id: string]: number | string,
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
  BG = '#222629',
}

const Canvas = ({
  data,
  width,
  height,
}: {
  data: LogEntry[],
  width: number,
  height: number,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [indicatorPos, setIndicatorPos] = useState(0);
  const [previousTouch, setPreviousTouch] = useState<Touch | null>(null);
  const leftBoundary = 0;
  const [rightBoundary, setRightBoundary] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkPan = useCallback((current: number, value: number) => {
    if (current > leftBoundary) {
      return leftBoundary;
    }
    if (current < rightBoundary) {
      return rightBoundary;
    }
    return value;
  }, [rightBoundary]);

  const plot = useCallback(() => {
    const canvas = canvasRef.current!;
    const fieldsToPlot = [
      { name: 'RPM', scale: 0.1 },
      { name: 'TPS', scale: 5 },
      { name: 'AFR Target', scale: 2 },
      { name: 'AFR', scale: 2 },
      { name: 'MAP', scale: 5 },
    ];
    const ctx = canvas.getContext('2d')!;
    const lastEntry = data[data.length - 1];
    const maxTime = (lastEntry.Time as number) / (zoom < 1 ? 1 : zoom);
    const areaWidth = canvas.width;
    const areaHeight = canvas.height - 30; // leave some space in the bottom
    const xScale = areaWidth / maxTime;
    const firstEntry = data[0];
    const scaledWidth = areaWidth * zoom / 1;
    const start = pan;
    // TODO: adjust this based on FPS / preference
    const resolution = Math.round(data.length / 1000 / zoom) || 1; // 1..x where 1 is max
    setRightBoundary(-(scaledWidth - areaWidth));

    const hsl = (fieldIndex: number) => {
      const [hue] = colorHsl(0, fieldsToPlot.length - 1, fieldIndex);
      return `hsl(${hue}, 80%, 50%)`;
    };

    // basic settings
    ctx.font = '14px Arial';
    ctx.lineWidth = Math.max(1.25, areaHeight / 400);

    if (zoom < 1) {
      setZoom(1);
      setPan(0);
      return;
    }

    if (pan > leftBoundary || pan < rightBoundary) {
      return;
    }

    const drawText = (left: number, top: number, text: string, color: string, textAlign = 'left') => {
      ctx.textAlign = textAlign as any;
      ctx.fillStyle = Colors.BG;
      ctx.fillText(text, left + 2, top + 2);
      ctx.fillStyle = color;
      ctx.fillText(text, left, top);
    };

    const plotField = (field: string, yScale: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.beginPath();

      // initial value
      ctx.moveTo(start, areaHeight - (firstEntry[field] as number * yScale));

      let index = 0;
      data.forEach((entry) => {
        index++;
        if (index % resolution !== 0) {
          return;
        }

        // draw marker on top of the record
        if (entry.type === 'marker') {
          return;
        }

        const time = (entry.Time as number) * xScale; // scale time to max width
        const value = areaHeight - (entry[field] as number * yScale); // scale the value

        ctx.lineTo(start + time, value);
      });

      ctx.stroke();
    };

    const drawIndicator = () => {
      ctx.setLineDash([5]);
      ctx.strokeStyle = Colors.WHITE;
      ctx.beginPath();

      // switch to time
      let index = Math.round(indicatorPos * (data.length - 1) / areaWidth);
      if (index < 0) {
        index = 0;
      }

      ctx.moveTo(indicatorPos, 0);

      let left = indicatorPos + 10;
      let textAlign = 'left';
      if (indicatorPos > areaWidth / 2) {
        // flip text to the left side of the indicator
        textAlign = 'right';
        left = indicatorPos - 10;
      }

      let top = 0;
      fieldsToPlot.forEach(({ name }, fieldIndex) => {
        top += 20;
        drawText(left, top, `${name}: ${data[index][name]}`, hsl(fieldIndex), textAlign);
      });

      // draw Time
      drawText(
        left,
        areaHeight + 20,
        msToTime(Math.round(data[index].Time as number * 1000)),
        Colors.GREY, textAlign,
      );

      ctx.lineTo(indicatorPos, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fieldsToPlot.forEach(({ name, scale }, fieldIndex) => plotField(name, scale, hsl(fieldIndex)));
    drawIndicator();
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

  const keyboardListener = useCallback((e: KeyboardEvent) => {
    if (isUp(e)) {
      setZoom((current) => current + 0.1);
    }
    if (isDown(e)) {
      setZoom((current) => {
        if (current < 1) {
          setPan(0);
          return 1;
        }
        return current - 0.1;
      });
    }
    if (isLeft(e)) {
      setPan((current) => checkPan(current, current + 20));
    }
    if (isRight(e)) {
      setPan((current) => checkPan(current, current - 20));
    }
  }, [checkPan]);

  useEffect(() => {
    plot();
    document.addEventListener('keydown', keyboardListener);

    // TODO: crate custom hook
    return () => {
      document.removeEventListener('keydown', keyboardListener);
    };
  }, [plot, width, height, keyboardListener]);

  return (
    <canvas
      ref={canvasRef as any}
      className="plot"
      width={width}
      height={height}
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
