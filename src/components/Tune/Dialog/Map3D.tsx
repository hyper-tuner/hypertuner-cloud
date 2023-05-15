import { Grid } from 'antd';
import LandscapeNotice from './LandscapeNotice';
import { colorHsl, formatNumber } from '../../../utils/numbers';

const { useBreakpoint } = Grid;

const Map3D = ({
  xData,
  yData,
  zData,
  xUnits,
  yUnits,
  zDigits,
}: {
  xData: number[];
  yData: number[];
  zData: number[][];
  xUnits: string;
  yUnits: string;
  zDigits: number;
}) => {
  const { sm } = useBreakpoint();
  const titleProps = { disabled: true };

  const min = Math.min(...zData.map((row) => Math.min(...row)));
  const max = Math.max(...zData.map((row) => Math.max(...row)));

  const renderRow = (rowIndex: number, input: number[]) =>
    input.map((value, index) => {
      const [hue, sat, light] = colorHsl(min, max, value);
      const yValue = yData[rowIndex];
      const result = [];

      if (index === 0) {
        result.push(
          <td {...titleProps} className='title-map' key={`y-${yValue}`}>
            {`${yValue}`}
          </td>,
        );
      }

      result.push(
        <td
          className='value'
          key={`${rowIndex}-${index}-${value}-${hue}${sat}${light}`}
          style={{ backgroundColor: `hsl(${hue}, ${sat}%, ${light}%)` }}
        >
          {formatNumber(value, zDigits)}
        </td>,
      );

      return result;
    });

  if (!sm) {
    return <LandscapeNotice />;
  }

  return (
    <div className='table'>
      <table>
        <tbody>
          {zData.map((row, i) => (
            <tr key={`row-${i}`}>{renderRow(i, row)}</tr>
          ))}
          <tr>
            <td {...titleProps} className='title-map'>
              {yUnits} / {xUnits}
            </td>
            {xData.map((xValue, l) => (
              <td {...titleProps} key={`x-${l}-${xValue}`}>
                {`${xValue}`}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Map3D;
