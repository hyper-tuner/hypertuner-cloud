import { ParserInterface } from '../ParserInterface';

class LogParser implements ParserInterface {
  private MLG_FORMAT_LENGTH = 6;

  private isMLGLogs: boolean = false;

  private isMSLLogs: boolean = false;

  private buffer: ArrayBuffer = new ArrayBuffer(0);

  private raw: string = '';

  public constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.raw = (new TextDecoder()).decode(buffer);

    this.checkMLG();
    this.checkMSL();
  }

  public parse(): this {
    return this;
  }

  public isMLG(): boolean {
    return this.isMLGLogs;
  }

  public isMSL(): boolean {
    return this.isMSLLogs;
  }

  private checkMLG() {
    const fileFormat = new TextDecoder('utf8')
      .decode(this.buffer.slice(0, this.MLG_FORMAT_LENGTH))
      // eslint-disable-next-line no-control-regex
      .replace(/\x00/gu, '');

    if (fileFormat === 'MLVLG') {
      this.isMLGLogs = true;
    }
  }

  private checkMSL() {
    const lines = this.raw.split('\n');
    for (let index = 0; index < lines.length; index++) {
      if (lines[index].startsWith('Time')) {
        this.isMSLLogs = true;
        break;
      }
    }
  }
}

export default LogParser;
