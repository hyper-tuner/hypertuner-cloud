/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */

import uPlot from 'uplot';

interface Point {
  x: number;
  y: number;
  d?: number;
  dx: number;
  dy: number;
};

const touchZoomPlugin = () => {
  const init = (u: uPlot, _opts: any, data: any) => {
    const { over } = u;

    let rect: DOMRect;
    let oxRange: number;
    let oyRange: number;
    let xVal: number;
    let yVal: number;

    const fr: Point = { x: 0, y: 0, dx: 0, dy: 0 };
    const to: Point = { x: 0, y: 0, dx: 0, dy: 0 };

    const storePos = (t: Point, e: TouchEvent) => {
      const ts = e.touches;

      const t0 = ts[0];
      const t0x = t0.clientX - rect.left;
      const t0y = t0.clientY - rect.top;

      if (ts.length === 1) {
        t.x = t0x;
        t.y = t0y;
        t.d = t.dx = t.dy = 1;
      }
      else {
        const t1 = e.touches[1];
        const t1x = t1.clientX - rect.left;
        const t1y = t1.clientY - rect.top;

        const xMin = Math.min(t0x, t1x);
        const yMin = Math.min(t0y, t1y);
        const xMax = Math.max(t0x, t1x);
        const yMax = Math.max(t0y, t1y);

        // mid points
        t.y = (yMin + yMax) / 2;
        t.x = (xMin + xMax) / 2;

        t.dx = xMax - xMin;
        t.dy = yMax - yMin;

        // dist
        t.d = Math.sqrt(t.dx * t.dx + t.dy * t.dy);
      }
    };

    let rafPending = false;

    const zoom = () => {
      rafPending = false;

      const left = to.x;
      const top = to.y;

      // non-uniform scaling
      //	let xFactor = fr.dx / to.dx;
      //	let yFactor = fr.dy / to.dy;

      // uniform x/y scaling
      const xFactor = fr.d! / to.d!;
      const yFactor = fr.d! / to.d!;

      const leftPct = left / rect.width;
      const btmPct = 1 - top / rect.height;

      const nxRange = oxRange * xFactor;
      const nxMin = xVal - leftPct * nxRange;
      const nxMax = nxMin + nxRange;

      const nyRange = oyRange * yFactor;
      const nyMin = yVal - btmPct * nyRange;
      const nyMax = nyMin + nyRange;

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
    };

    const touchmove = (e: TouchEvent) => {
      storePos(to, e);

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(zoom);
      }
    };

    over.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // prevent default pinch zoom
        e.preventDefault();
      }

      rect = over.getBoundingClientRect();

      storePos(fr, e);

      oxRange = u.scales.x.max! - u.scales.x.min!;
      oyRange = u.scales.y.max! - u.scales.y.min!;

      const left = fr.x;
      const top = fr.y;

      xVal = u.posToVal(left, 'x');
      yVal = u.posToVal(top, 'y');

      document.addEventListener('touchmove', touchmove, { passive: true });
    });

    over.addEventListener('touchend', (e: TouchEvent) => {
      document.removeEventListener('touchmove', touchmove);
    });
  };

  return {
    hooks: {
      init,
    },
  };
};

export default touchZoomPlugin;
