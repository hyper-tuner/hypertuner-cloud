/* eslint-disable no-continue */
import { Result } from 'mlg-converter/dist/types';
import { ParserInterface } from '../ParserInterface';

class MslLogParser implements ParserInterface {
  private buffer: ArrayBuffer = new ArrayBuffer(0);

  private raw: string = '';

  private result: Result = {
    fileFormat: 'MSL',
    formatVersion: 1,
    timestamp: new Date(),
    info: '',
    bitFieldNames: '',
    fields: [],
    records: [],
  };

  public constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.raw = (new TextDecoder()).decode(buffer);
  }

  public parse(onProgress: (percent: number) => void): this {
    let unitsIndex = 999;
    const lines = this.raw.trim().split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      // eslint-disable-next-line no-bitwise
      onProgress(~~(lineIndex / lines.length * 100));

      const line = lines[lineIndex].trim();
      if (line.startsWith('"')) {
        this.result.info += `${line.replaceAll('"', '').trim()}\n`;

        continue;
      }

      if (line.startsWith('Time')) {
        unitsIndex = lineIndex + 1;
        const fields = line.split('\t');
        const units = lines[unitsIndex].trim().split('\t');

        this.result.fields = fields.map((name, fieldIndex) => ({
          name: name.trim(),
          units: (units[fieldIndex] || '').trim(),
          displayStyle: 'Float',
          scale: 1,
          transform: 0,
          digits: 0,
        }));

        continue;
      }

      if (lineIndex > unitsIndex) {
        const fields = line.split('\t');
        const record = {
          type: 'field' as const,
          timestamp: 0,
        };

        fields.forEach((value, fieldIndex) => {
          (record as any)[this.result.fields[fieldIndex].name] = parseFloat(value);
        });

        this.result.records.push(record);
      }
    };

    return this;
  }

  public getResult(): Result {
    return this.result;
  }
}

export default MslLogParser;
