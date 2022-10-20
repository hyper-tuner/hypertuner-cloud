import { ParserInterface } from '../ParserInterface';

class MslLogParser implements ParserInterface {
  private buffer: ArrayBuffer = new ArrayBuffer(0);

  private raw: string = '';

  public constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.raw = (new TextDecoder()).decode(buffer);
  }

  public parse(): this {
    console.log(this.raw);
    return this;
  }
}

export default MslLogParser;
