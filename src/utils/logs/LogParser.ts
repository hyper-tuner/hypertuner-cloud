import { ParserInterface } from '../ParserInterface';

class LogParser implements ParserInterface {
  private MLG_FORMAT_LENGTH = 6;

  private isMLGLogs: boolean = false;

  private isMSLLogs: boolean = false;

  private isCSVLogs: boolean = false;

  private buffer: ArrayBuffer = new ArrayBuffer(0);

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.checkMLG();
  }

  parse(): this {
    return this;
  }

  isMLG(): boolean {
    return this.isMLGLogs;
  }

  isMSL(): boolean {
    return this.isMSLLogs;
  }

  isCSV(): boolean {
    return this.isCSVLogs;
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
}

export default LogParser;
