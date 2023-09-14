import { BlockType, Record, Result } from 'mlg-converter/dist/types';
import { ParserInterface } from '../ParserInterface';

class MslLogParser implements ParserInterface {
  private markerPrefix = 'MARK';

  private raw = '';

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
    this.raw = new TextDecoder().decode(buffer);
  }

  public parse(onProgress: (percent: number) => void): this {
    let unitsIndex = 999;
    const lines = this.raw.trim().split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      onProgress(~~((lineIndex / lines.length) * 100));

      const line = lines[lineIndex].trim();
      if (line.startsWith('"')) {
        this.result.info += `${line.replaceAll('"', '').trim()}\n`;

        continue;
      }

      // header line eg. Time	SD: Present	SD: Logging	triggerScopeReady...
      if (line.startsWith('Time') || line.startsWith('RPM')) {
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
          category: '',
        }));

        continue;
      }

      // markers: eg. MARK 000
      if (line.startsWith(this.markerPrefix)) {
        // TODO: parse markers
        continue;
      }

      if (lineIndex > unitsIndex) {
        // data line eg. 215.389	0	0	0	0	0	1	0	1...
        const fields = line.split('\t');
        const record: Record = {
          type: 'field' as BlockType, // TODO: use enum
          timestamp: 0,
        };

        fields.forEach((value, fieldIndex) => {
          record[this.result.fields[fieldIndex].name] = parseFloat(value);
        });

        this.result.records.push(record);
      }
    }

    return this;
  }

  public getResult(): Result {
    return this.result;
  }
}

export default MslLogParser;
