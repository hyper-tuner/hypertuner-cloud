import { InputNumber, Slider } from 'antd';
import { formatNumber } from '../../../utils/numbers';

const SmartNumber = ({
  defaultValue,
  min,
  max,
  units,
  digits,
  disabled,
}: {
  defaultValue: number;
  min: number;
  max: number;
  units: string | undefined;
  digits: number;
  disabled: boolean;
}) => {
  const isSlider = (u: string) => ['%', 'C'].includes(`${u}`.toUpperCase());
  const sliderMarks: { [value: number]: string } = {};
  const step = digits ? 10 ** -digits : 1;
  const val = formatNumber(defaultValue, digits);
  sliderMarks[min] = `${min}${units}`;

  if (min <= 0) {
    sliderMarks[0] = `0${units}`;
  }

  if (max) {
    sliderMarks[max] = `${max}${units}`;
  }

  if (isSlider(units || '')) {
    return (
      <Slider
        value={val as unknown as number}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        marks={sliderMarks}
        tooltip={{
          formatter: (val) => `${val}${units}`,
        }}
      />
    );
  }

  return (
    <InputNumber
      value={val as unknown as number}
      precision={digits}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      style={{ minWidth: 150 }}
      formatter={(val) => (units ? `${val} ${units}` : `${val}`)}
      parser={(val) => Number(`${val}`.replace(/[^\d.]/g, ''))}
    />
  );
};

export default SmartNumber;
