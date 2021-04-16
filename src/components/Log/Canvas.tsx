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
  useMemo,
} from 'react';
import {
  isDown,
  isLeft,
  isRight,
  isUp,
} from '../../utils/keyboard/shortcuts';
import {
  colorHsl,
  formatNumber,
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
  format: string;
};

export interface PlottableField {
  min: number;
  max: number;
  scale: number;
  transform: number;
  units: string;
  format: string;
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

  const hsl = useCallback((fieldIndex: number, allFields: number) => {
    const [hue] = colorHsl(0, allFields - 1, fieldIndex);
    return `hsl(${hue}, 90%, 50%)`;
  }, []);

  const canvas = canvasRef.current!;
  const ctx = useMemo(() => canvas && canvas.getContext('2d', { alpha: true })!, [canvas]);
  const canvasWidth = canvas ? canvas.width : 0;
  const canvasHeight = canvas ? canvas.height : 0;
  const areaWidth = canvas ? canvasWidth : 0;
  const areaHeight = canvas ? canvasHeight - 30 : 0; // leave some space in the bottom
  const lastIndex = data.length - 1;
  const lastEntry = useMemo(() => data[lastIndex], [data, lastIndex]);
  const maxTime = useMemo(() => (lastEntry.Time as number) / (zoom < 1 ? 1 : zoom), [lastEntry.Time, zoom]);
  const maxIndex = useMemo(() => Math.round(lastIndex / (zoom < 1 ? 1 : zoom)), [lastIndex, zoom]);
  const timeScale = areaWidth / maxTime;
  // const indexScale = areaWidth / maxIndex;
  const firstEntry = data[0];
  const scaledWidth = useMemo(() => areaWidth * zoom / 1, [areaWidth, zoom]);
  const startTime = pan;
  const startIndex = useMemo(
    () => Math.round(startTime >= 0 ? 0 : -(startTime * maxIndex / areaWidth)),
    [areaWidth, maxIndex, startTime],
  );

  // find max values for each selected field so we can calculate scale
  const fieldsToPlot = useMemo(() => {
    const temp: { [index: string]: PlottableField } = {};

    data.forEach((record) => {
      selectedFields.forEach(({ name, scale, transform, units, format }) => {
        const value = record[name];
        if (!temp[name]) {
          temp[name] = {
            min: 0,
            max: 0,
            scale: scale as number,
            transform: transform as number,
            units,
            format,
          };
        }
        if (value > temp[name].max) {
          temp[name].max = record[name] as number;
        }
        if (value < temp[name].min) {
          temp[name].min = record[name] as number;
        }
      });
    });

    return temp;
  }, [data, selectedFields]);

  const fieldsKeys = useMemo(() => Object.keys(fieldsToPlot), [fieldsToPlot]);

  // 1..x where 1 is max
  const resolution = useMemo(() =>
    Math.round(data.length / 1_000 / zoom) || 1, [data.length, zoom]);

  const dataWindow = useMemo(
    () => data
      .slice(startIndex, startIndex + maxIndex) // slice the data array
      .filter((_, index) => index % resolution === 0),
    [data, maxIndex, resolution, startIndex],
  );

  const plotField = useCallback((field: string, min: number, max: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.beginPath();

    // initial value
    ctx.moveTo(startTime, areaHeight - remap(firstEntry[field] as number, min, max, 0, areaHeight));

    dataWindow.forEach((entry) => {
      // draw marker on top of the record
      if (entry.type === 'marker') {
        // TODO: draw actual marker
        return;
      }

      const time = (entry.Time as number) * timeScale; // scale time to max width
      const value = areaHeight - remap(entry[field] as number, min, max, 0, areaHeight); // scale the value

      ctx.lineTo(Math.round(startTime + time), Math.round(value));
    });

    ctx.stroke();
  }, [areaHeight, ctx, dataWindow, firstEntry, startTime, timeScale]);

  const drawText = useCallback((left: number, top: number, text: string, color: string, textAlign = 'left') => {
    ctx.textAlign = textAlign as any;
    ctx.fillStyle = Colors.BG;
    ctx.fillText(text, left + 2, top + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, left, top);
  }, [ctx]);

  const drawIndicator = useCallback(() => {
    ctx.setLineDash([5]);
    ctx.strokeStyle = Colors.WHITE;
    ctx.beginPath();

    // switch to time
    let index = Math.round(indicatorPos * (data.length - 1) / areaWidth);
    if (index < 0) {
      index = 0;
    }

    const currentData = data[index];

    ctx.moveTo(indicatorPos, 0);

    let left = indicatorPos + 10;
    let textAlign = 'left';
    if (indicatorPos > areaWidth / 2) {
      // flip text to the left side of the indicator
      textAlign = 'right';
      left = indicatorPos - 10;
    }

    let top = 0;
    fieldsKeys.forEach((name, fieldIndex) => {
      const field = fieldsToPlot[name];
      const { units, scale, transform, format } = field;
      const value = formatNumber((currentData[name] as number * scale) + transform, format);
      top += 20;

      drawText(
        left,
        top,
        `${name}: ${value}${units ? ` (${units})` : ''}`,
        hsl(fieldIndex, fieldsKeys.length),
        textAlign,
      );
    });

    // draw Time
    drawText(
      left,
      areaHeight + 20,
      msToTime(Math.round(currentData.Time as number * 1000)),
      Colors.GREY, textAlign,
    );

    ctx.lineTo(indicatorPos, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [areaHeight, areaWidth, canvasHeight, ctx, data, drawText, fieldsKeys, fieldsToPlot, hsl, indicatorPos]);

  const plot = useCallback(() => {
    if (!ctx) {
      return;
    }

    setRightBoundary(-(scaledWidth - areaWidth));

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

    // clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    fieldsKeys.forEach((name, fieldIndex) => plotField(
      name,
      fieldsToPlot[name].min,
      fieldsToPlot[name].max,
      hsl(fieldIndex, fieldsKeys.length)),
    );
    drawIndicator();
  }, [
    ctx,
    scaledWidth,
    areaWidth,
    areaHeight,
    zoom,
    pan,
    rightBoundary,
    canvasWidth,
    canvasHeight,
    fieldsKeys,
    drawIndicator,
    plotField,
    fieldsToPlot,
    hsl,
  ]);

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
