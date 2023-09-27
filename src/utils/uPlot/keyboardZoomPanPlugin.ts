import uPlot, { Plugin } from 'uplot';

interface KeyboardZoomPluginOptions {
  zoomFactor?: number;
  scrollFactor?: number;
}

function keyboardZoomPlugin(options: KeyboardZoomPluginOptions = {}): Plugin {
  const { zoomFactor = 0.9 } = options;

  return {
    hooks: {
      ready(u: uPlot) {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();

            const cursor = u.cursor;
            const { left, top } = cursor;
            const xVal = u.posToVal(left || 0, 'x');
            const yVal = u.posToVal(top || 0, 'y');

            const xRange = (u.scales.x.max ?? 0) - (u.scales.x.min ?? 0);
            const yRange = (u.scales.y.max ?? 0) - (u.scales.y.min ?? 0);

            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              const zoomOut = e.key === 'ArrowDown';
              const newZoomFactor = zoomOut ? 1 / zoomFactor : zoomFactor;

              const nxRange = xRange * newZoomFactor;
              const nxMin = xVal - (xVal - (u.scales.x.min ?? 0)) * newZoomFactor;

              const nyRange = yRange * newZoomFactor;
              const nyMin = yVal - (yVal - (u.scales.y.min ?? 0)) * newZoomFactor;

              u.batch(() => {
                u.setScale('x', { min: nxMin, max: nxMin + nxRange });
                u.setScale('y', { min: nyMin, max: nyMin + nyRange });
              });
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              const scrollDirection = e.key === 'ArrowLeft' ? -1 : 1;
              const scrollAmount = (xRange / 10) * scrollDirection;
              const nxMin = (u.scales.x.min ?? 0) + scrollAmount;

              u.batch(() => {
                u.setScale('x', { min: nxMin, max: nxMin + xRange });
              });
            }
          }
        });
      },
    },
  };
}

export default keyboardZoomPlugin;
