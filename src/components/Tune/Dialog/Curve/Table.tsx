/* eslint-disable react/no-array-index-key */

import { useCallback } from 'react';
import { colorHsl } from '../../../../utils/number';

const titleProps = { disabled: true };

type AxisType = 'x' | 'y';

const Table = ({
  xLabel,
  yLabel,
  xData,
  yData,
  disabled,
  xUnits,
  yUnits,
}: {
  xLabel: string,
  yLabel: string,
  xData: number[],
  yData: number[],
  disabled: boolean,
  xUnits: string,
  yUnits: string,
}) => {
  const renderRow = useCallback((axis: AxisType, input: number[]) => input
    .map((value, index) => {
      const [hue, sat, light] = colorHsl(Math.min(...input), Math.max(...input), value);

      return (
        <td
          className="value"
          key={`${axis}-${index}-${value}-${hue}${sat}${light}`}
          style={{ backgroundColor: `hsl(${hue}, ${sat}%, ${light}%)` }}
        >
          {`${value}`}
        </td>
      );
    }), []);

  return (
    <div className="table">
      <table>
        <tbody>
          <tr>
            <td {...titleProps} className="title-curve" key={yLabel}>{`${yLabel} (${yUnits})`}</td>
            {renderRow('y', yData)}
          </tr>
          <tr>
            <td {...titleProps} className="title-curve" key={xLabel}>{`${xLabel} (${xUnits})`}</td>
            {renderRow('x', xData)}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Table;
