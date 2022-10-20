import { ParserInterface } from '../ParserInterface';
import { isNumber } from '../tune/expression';

export enum EntryType {
  TRIGGER = 'trigger',
  MARKER = 'marker',
}

export interface CompositeLogEntry {
  type: EntryType;
  primaryLevel: number;
  secondaryLevel: number;
  trigger: number;
  sync: number;
  refTime: number;
  maxTime: number;
  toothTime: number;
  time: number;
}

export interface ToothLogEntry {
  type: EntryType;
  toothTime: number;
  time: number;
}

class TriggerLogsParser implements ParserInterface {
  private COMMENT_PREFIX = '#';

  private MARKER_PREFIX = 'MARK';

  private isToothLogs: boolean = false;

  private isCompositeLogs: boolean = false;

  private resultComposite: CompositeLogEntry[] = [];

  private resultTooth: ToothLogEntry[] = [];

  private alreadyParsed: boolean = false;

  private raw: string = '';

  public constructor(buffer: ArrayBuffer) {
    this.raw = (new TextDecoder()).decode(buffer);
  }

  public parse(): this {
    this.parseCompositeLogs(this.raw);
    this.parseToothLogs(this.raw);

    if (this.resultComposite.length > this.resultTooth.length) {
      this.isCompositeLogs = true;
    } else {
      this.isToothLogs = true;
    }

    this.alreadyParsed = true;

    return this;
  }

  public getCompositeLogs(): CompositeLogEntry[] {
    return this.resultComposite;
  }

  public getToothLogs(): ToothLogEntry[] {
    return this.resultTooth;
  }

  public isTooth(): boolean {
    if (!this.alreadyParsed) {
      this.parse();
    }

    return this.isToothLogs;
  }

  public isComposite(): boolean {
    if (!this.alreadyParsed) {
      this.parse();
    }

    return this.isCompositeLogs;
  }

  private parseToothLogs(raw: string): void {
    this.resultTooth = [];

    raw.split('\n').forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith(this.COMMENT_PREFIX)) {
        return;
      }

      if (trimmed.startsWith(this.MARKER_PREFIX)) {
        const previous = this.resultTooth[this.resultTooth.length - 1] || {
          toothTime: 0,
          time: 0,
        };

        this.resultTooth.push({
          type: EntryType.MARKER,
          toothTime: previous.toothTime,
          time: previous.time,
        });

        return;
      }

      const split = trimmed.split(',');
      if (!isNumber(split[0])) {
        return;
      }

      const time = Number(split[1]);
      if (!time) {
        return;
      }

      this.resultTooth.push({
        type: EntryType.TRIGGER,
        toothTime: Number(split[0]),
        time,
      });
    });
  }

  private parseCompositeLogs(raw: string): void {
    this.resultComposite = [];

    raw.split('\n').forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith(this.COMMENT_PREFIX)) {
        return;
      }

      if (trimmed.startsWith(this.MARKER_PREFIX)) {
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
          type: EntryType.MARKER,
          primaryLevel: previous.primaryLevel,
          secondaryLevel: previous.secondaryLevel,
          trigger: previous.trigger,
          sync: previous.sync,
          refTime: previous.refTime,
          maxTime: previous.maxTime,
          toothTime: previous.toothTime,
          time: previous.time,
        });

        return;
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
        type: EntryType.TRIGGER,
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
