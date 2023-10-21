import { Plugin as uPlotPlugin } from 'uplot';
import { ZoomPluginOptions } from './zoomPluginOptions';

const ARROW_UP = 'ArrowUp';
const ARROW_DOWN = 'ArrowDown';
const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';

function keyboardZoomPlugin(options: ZoomPluginOptions = {}): uPlotPlugin {
  const { zoomFactor = 0.9, panFactor = 0.3 } = options;

  return {
    hooks: {
      ready(u) {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.ctrlKey || e.metaKey) {
            return;
          }

          const cursor = u.cursor;
          const { left, top } = cursor;
          const xVal = u.posToVal(left || 0, 'x');
          const yVal = u.posToVal(top || 0, 'y');

          const xRange = (u.scales.x.max ?? 0) - (u.scales.x.min ?? 0);
          const yRange = (u.scales.y.max ?? 0) - (u.scales.y.min ?? 0);

          if (e.key === ARROW_UP || e.key === ARROW_DOWN) {
            const zoomOut = e.key === ARROW_DOWN;
            const newZoomFactor = zoomOut ? 1 / zoomFactor : zoomFactor;

            const nxRange = xRange * newZoomFactor;
            const nxMin = xVal - (xVal - (u.scales.x.min ?? 0)) * newZoomFactor;

            const nyRange = yRange * newZoomFactor;
            const nyMin = yVal - (yVal - (u.scales.y.min ?? 0)) * newZoomFactor;

            u.batch(() => {
              u.setScale('x', { min: nxMin, max: nxMin + nxRange });
              u.setScale('y', { min: nyMin, max: nyMin + nyRange });
            });
          } else if (e.key === ARROW_LEFT || e.key === ARROW_RIGHT) {
            const scrollDirection = e.key === ARROW_LEFT ? -1 : 1;
            const scrollAmount = (xRange / 10) * scrollDirection * panFactor;
            const nxMin = (u.scales.x.min ?? 0) + scrollAmount;

            u.batch(() => {
              u.setScale('x', { min: nxMin, max: nxMin + xRange });
            });
          }
        });
      },
    },
  };
}

export default keyboardZoomPlugin;
