import { Plugin, uPlot } from 'uplot';

interface WheelZoomPluginOptions {
  factor?: number;
  animationDuration?: number;
}

function wheelZoomPlugin(options: WheelZoomPluginOptions = {}): Plugin {
  const factor = options.factor || 0.90;
  const animationDuration = options.animationDuration || 0.01;

  return {
    hooks: {
      ready(u: uPlot) {
        let xMin: number, xMax: number, yMin: number, yMax: number, xRange: number, yRange: number;
        let over = u.over;
        let rect: DOMRect;
        let ctrlPressed = false; // Flag to track whether the Ctrl key is pressed

        // Helper function to check if the Ctrl key is pressed
        function isCtrlPressed(e: MouseEvent): boolean {
          return e.ctrlKey || e.metaKey; // Use metaKey for macOS
        }

        function clamp(
          nRange: number,
          nMin: number,
          nMax: number,
          fRange: number,
          fMin: number,
          fMax: number
        ): [number, number] {
          if (nRange > fRange) {
            nMin = fMin;
            nMax = fMax;
          } else if (nMin < fMin) {
            nMin = fMin;
            nMax = fMin + nRange;
          } else if (nMax > fMax) {
            nMax = fMax;
            nMin = fMax - nRange;
          }

          return [nMin, nMax];
        }

        over.addEventListener('mousedown', (e) => {
          if (e.button === 1) {
            e.preventDefault();

            const left0 = e.clientX;
            const scXMin0 = u.scales.x.min;
            const scXMax0 = u.scales.x.max;
            const xUnitsPerPx = u.valToPos(1, 'x') - u.valToPos(0, 'x');

            function onmove(e) {
              e.preventDefault();

              const left1 = e.clientX;
              const dx = xUnitsPerPx * (left1 - left0);

              u.setScale('x', {
                min: scXMin0 - dx,
                max: scXMax0 - dx,
                duration: animationDuration,
              });
            }

            function onup(e) {
              document.removeEventListener('mousemove', onmove);
              document.removeEventListener('mouseup', onup);
            }

            document.addEventListener('mousemove', onmove);
            document.addEventListener('mouseup', onup);
          }
        });

        over.addEventListener('wheel', (e) => {
          e.preventDefault();

          if (!isCtrlPressed(e)) {
            // Check if the Ctrl key is not pressed
            return;
          }

          const cursor = u.cursor;
          const { left, top } = cursor;
          const leftPct = left / rect.width;
          const btmPct = 1 - top / rect.height;
          const xVal = u.posToVal(left, 'x');
          const yVal = u.posToVal(top, 'y');
          const oxRange = u.scales.x.max - u.scales.x.min;
          const oyRange = u.scales.y.max - u.scales.y.min;

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
              duration: animationDuration,
            });

            u.setScale('y', {
              min: nyMin,
              max: nyMax,
              duration: animationDuration,
            });
          });
        });

        // Store the initial scales and rect
        xMin = u.scales.x.min;
        xMax = u.scales.x.max;
        yMin = u.scales.y.min;
        yMax = u.scales.y.max;
        xRange = xMax - xMin;
        yRange = yMax - yMin;
        rect = over.getBoundingClientRect();

        // Listen for the keydown and keyup events to track the Ctrl key
        document.addEventListener('keydown', (e) => {
          if (isCtrlPressed(e)) {
            ctrlPressed = true;
          }
        });

        document.addEventListener('keyup', (e) => {
          if (!isCtrlPressed(e)) {
            ctrlPressed = false;
          }
        });
      },
    },
  };
}

export default wheelZoomPlugin;
