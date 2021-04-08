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
  remap,
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

export interface SelectedField {
  name: string;
  units: string;
  scale: string | number;
  transform: string | number;
};

const Canvas = ({
  data,
  width,
  height,
  selectedFields,
}: {
  data: LogEntry[],
  width: number,
  height: number,
  selectedFields: SelectedField[],
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
    const hsl = (fieldIndex: number, allFields: number) => {
      const [hue] = colorHsl(0, allFields - 1, fieldIndex);
      return `hsl(${hue}, 80%, 50%)`;
    };
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

    // find max values for each selected field so we can calculate scale
    const fieldsToPlot: { [index: string]: { min: number, max: number, scale: number, transform: number } } = {};
    data.forEach((record) => {
      selectedFields.forEach((field) => {
        const value = record[field.name];
        if (!fieldsToPlot[field.name]) {
          fieldsToPlot[field.name] = {
            min: 0,
            max: 0,
            scale: field.scale as number,
            transform: field.transform as number,
          };
        }
        if (value > fieldsToPlot[field.name].max) {
          fieldsToPlot[field.name].max = record[field.name] as number;
        }
        if (value < fieldsToPlot[field.name].min) {
          fieldsToPlot[field.name].min = record[field.name] as number;
        }
      });
    });

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

    const plotField = (field: string, min: number, max: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.beginPath();

      // initial value
      ctx.moveTo(start, areaHeight - remap(firstEntry[field] as number, min, max, 0, areaHeight));

      let index = 0;
      data.forEach((entry) => {
        index++;
        if (index % resolution !== 0) {
          return;
        }

        // draw marker on top of the record
        if (entry.type === 'marker') {
          // TODO: draw actual marker
          return;
        }

        const time = (entry.Time as number) * xScale; // scale time to max width
        const value = areaHeight - remap(entry[field] as number, min, max, 0, areaHeight); // scale the value

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
      Object.keys(fieldsToPlot).forEach((name, fieldIndex) => {
        top += 20;
        drawText(
          left,
          top,
          `${name}: ${data[index][name]}`,
          hsl(fieldIndex, Object.keys(fieldsToPlot).length),
          textAlign,
        );
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

    Object.keys(fieldsToPlot).forEach((name, fieldIndex) => plotField(
      name,
      fieldsToPlot[name].min,
      fieldsToPlot[name].max,
      hsl(fieldIndex, Object.keys(fieldsToPlot).length)),
    );
    drawIndicator();
  }, [data, zoom, pan, rightBoundary, selectedFields, indicatorPos]);

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
    // TODO:
    // onKeyLeft
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
