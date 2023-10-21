export interface ParserInterface {
  parse(onProgress: (percent: number) => void): this;
}

export type ParserConstructor = new (buffer: ArrayBuffer) => ParserInterface;
