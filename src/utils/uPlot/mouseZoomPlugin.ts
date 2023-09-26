import uPlot from 'uplot';
import { Plugin } from 'uplot';

interface WheelZoomPluginOptions {
  factor?: number;
  animationDuration?: number;
}

function wheelZoomPlugin(options: WheelZoomPluginOptions = {}): Plugin {
  const factor = options.factor || 0.9;

  let xMin: number;
  let xMax: number;
  let yMin: number;
  let yMax: number;
  let xRange: number;
  let yRange: number;
  let over = null;
  let rect: DOMRect;

  function isCtrlPressed(e: MouseEvent): boolean {
    return e.ctrlKey || e.metaKey;
  }

  function clamp(
    nRange: number,
    nMin: number,
    nMax: number,
    fRange: number,
    fMin: number,
    fMax: number,
  ): [number, number] {
    let newNMin = nMin;
    let newNMax = nMax;

    if (nRange > fRange) {
      newNMin = fMin;
      newNMax = fMax;
    } else if (nMin < fMin) {
      newNMin = fMin;
      newNMax = fMin + nRange;
    } else if (nMax > fMax) {
      newNMax = fMax;
      newNMin = fMax - nRange;
    }

    return [newNMin, newNMax];
  }

  return {
    hooks: {
      ready(u: uPlot) {
        xMin = u.scales.x.min ?? 0;
        xMax = u.scales.x.max ?? 0;
        yMin = u.scales.y.min ?? 0;
        yMax = u.scales.y.max ?? 0;
        xRange = xMax - xMin;
        yRange = yMax - yMin;
        over = u.over;
        rect = over.getBoundingClientRect();

        over.addEventListener('mousedown', (e: MouseEvent) => {
          if (e.button === 1) {
            e.preventDefault();

            const left0 = e.clientX;
            const scXMin0 = u.scales.x.min;
            const scXMax0 = u.scales.x.max;
            const xUnitsPerPx = u.valToPos(1, 'x') - u.valToPos(0, 'x');

            function onmove(e: MouseEvent) {
              e.preventDefault();

              const left1 = e.clientX;
              const dx = xUnitsPerPx * (left1 - left0);

              u.setScale('x', {
                min: (scXMin0 ?? 0) - dx,
                max: (scXMax0 ?? 0) - dx,
              });
            }

            document.addEventListener('mousemove', onmove);
          }
        });

        over.addEventListener('wheel', (e: WheelEvent) => {
          e.preventDefault();

          if (!isCtrlPressed(e)) {
            return;
          }

          const cursor = u.cursor;

          const { left, top } = cursor;
          const leftPct = (left || 0) / rect.width;
          const btmPct = 1 - (top || 0) / rect.height;
          const xVal = u.posToVal(left || 0, 'x');
          const yVal = u.posToVal(top || 0, 'y');
          const oxRange = (u.scales.x.max || 0) - (u.scales.x.min || 0);
          const oyRange = (u.scales.y.max || 0) - (u.scales.y.min || 0);

          const nxRange = e.deltaY < 0 ? oxRange * factor : oxRange / factor;
          let nxMin = xVal - leftPct * nxRange;
          let nxMax = nxMin + nxRange;
          [nxMin, nxMax] = clamp(nxRange, nxMin, nxMax, xRange, xMin, xMax);

          const nyRange = e.deltaY < 0 ? oyRange * factor : oyRange / factor;
          let nyMin = yVal - btmPct * nyRange;
          let nyMax = nyMin + nyRange;
          [nyMin, nyMax] = clamp(nyRange, nyMin, nyMax, yRange, yMin, yMax);

          u.batch(() => {
            u.setScale('x', {
              min: nxMin,
              max: nxMax,
            });

            u.setScale('y', {
              min: nyMin,
              max: nyMax,
            });
          });
        });

        document.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.ctrlKey || e.metaKey) {
          }
        });

        document.addEventListener('keyup', (e: KeyboardEvent) => {
          if (!e.ctrlKey && !e.metaKey) {
          }
        });
      },
    },
  };
}

export default wheelZoomPlugin;
