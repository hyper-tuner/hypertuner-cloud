import { isNumber } from '../tune/expression';

export interface CompositeLogEntry {
  type: 'trigger' | 'marker';
  primaryLevel: number;
  secondaryLevel: number;
  trigger: number;
  sync: number;
  refTime: number;
  maxTime: number;
  toothTime: number;
  time: number;
}

class TriggerLogsParser {
  raw: string;

  isTooth: boolean = false;

  isComposite: boolean = false;

  resultComposite: CompositeLogEntry[] = [];

  constructor(buffer: ArrayBuffer) {
    this.raw = (new TextDecoder()).decode(buffer);
  }

  parse() {
    this.parseCompositeLogs();

    return this;
  }

  getCompositeLogs() {
    return this.resultComposite;
  }

  private parseCompositeLogs() {
    this.raw.split('\n').forEach((line) => {
      const trimmed = line.trim();

      // skip comments
      if (trimmed.startsWith('#')) {
        return;
      }

      // markers
      if (trimmed.startsWith('MARK')) {
        const previous = this.resultComposite[this.resultComposite.length - 1] || {
          primaryLevel: 0,
          secondaryLevel: 0,
          trigger: 0,
          sync: 0,
          refTime: 0,
          maxTime: 0,
          toothTime: 0,
          time: 0,
        };

        this.resultComposite.push({
          type: 'marker',
          primaryLevel: previous.primaryLevel,
          secondaryLevel: previous.secondaryLevel,
          trigger: previous.trigger,
          sync: previous.sync,
          refTime: previous.refTime,
          maxTime: previous.maxTime,
          toothTime: previous.toothTime,
          time: previous.time,
        });
      }

      const split = trimmed.split(',');
      if (!isNumber(split[0])) {
        return;
      }

      const time = Number(split[7]);
      if (!time) {
        return;
      }

      this.resultComposite.push({
        type: 'trigger',
        primaryLevel: Number(split[0]),
        secondaryLevel: Number(split[1]),
        trigger: Number(split[2]),
        sync: Number(split[3]),
        refTime: Number(split[4]),
        maxTime: Number(split[5]),
        toothTime: Number(split[6]),
        time,
      });
    });
  }
}

export default TriggerLogsParser;
