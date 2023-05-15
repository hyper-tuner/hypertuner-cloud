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

  private isToothLogs = false;

  private isCompositeLogs = false;

  private resultComposite: CompositeLogEntry[] = [];

  private resultTooth: ToothLogEntry[] = [];

  private alreadyParsed = false;

  private raw = '';

  public constructor(buffer: ArrayBuffer) {
    this.raw = new TextDecoder().decode(buffer);
  }

  public parse(): this {
    this.detectType();

    if (this.isToothLogs) {
      this.parseToothLogs(this.raw);
    }

    if (this.isCompositeLogs) {
      this.parseCompositeLogs(this.raw);
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

  private detectType(): void {
    this.raw.split('\n').some((line, index) => {
      const trimmed = line.trim();

      // give up
      if (index > 10) {
        return true;
      }

      const parts = trimmed.split(',');

      if (parts.length === 2) {
        this.isToothLogs = true;

        return true;
      }

      if (parts.length >= 7) {
        this.isCompositeLogs = true;

        return true;
      }

      return false;
    });
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

      const parts = trimmed.split(',');
      if (parts.length !== 2) {
        return;
      }

      if (!(isNumber(parts[0]) && isNumber(parts[1]))) {
        return;
      }

      this.resultTooth.push({
        type: EntryType.TRIGGER,
        toothTime: Number(parts[0]),
        time: Number(parts[1]),
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

      const parts = trimmed.split(',');

      if (!(isNumber(parts[0]) && isNumber(parts[1]))) {
        return;
      }

      const base = {
        type: EntryType.TRIGGER,
        primaryLevel: Number(parts[0]),
        secondaryLevel: Number(parts[1]),
        trigger: Number(parts[2]),
        sync: Number(parts[3]),
        refTime: Number(parts[4]),
      };

      if (parts.length === 8) {
        // PriLevel,SecLevel,Trigger,Sync,RefTime,MaxTime,ToothTime,Time
        this.resultComposite.push({
          ...base,
          maxTime: Number(parts[5]),
          toothTime: Number(parts[6]),
          time: Number(parts[7]),
        });

        return;
      }

      if (parts.length === 7) {
        // PriLevel,SecLevel,Trigger,Sync,RefTime,ToothTime,Time
        this.resultComposite.push({
          ...base,
          maxTime: 0,
          toothTime: Number(parts[5]),
          time: Number(parts[6]),
        });
      }
    });
  }
}

export default TriggerLogsParser;
