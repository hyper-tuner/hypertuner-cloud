import { ParserInterface } from '../ParserInterface';

class LogValidator implements ParserInterface {
  private mlgFormatLength = 6;

  private isMLGLogs = false;

  private isMSLLogs = false;

  private buffer: ArrayBuffer = new ArrayBuffer(0);

  private raw = '';

  public constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.raw = new TextDecoder().decode(buffer);

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
      .decode(this.buffer.slice(0, this.mlgFormatLength))
      // biome-ignore lint/suspicious/noControlCharactersInRegex: false positive
      .replace(/\x00/gu, '');

    if (fileFormat === 'MLVLG') {
      this.isMLGLogs = true;
    }
  }

  private checkMSL() {
    const lines = this.raw.split('\n');
    for (let index = 0; index < lines.length; index++) {
      if (lines[index].startsWith('Time') || lines[index].startsWith('RPM')) {
        this.isMSLLogs = true;
        break;
      }

      if (index > 10) {
        break;
      }
    }
  }
}

export default LogValidator;
