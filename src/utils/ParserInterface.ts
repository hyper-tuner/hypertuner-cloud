export interface ParserInterface {
  parse(onProgress: (percent: number) => void): this;
}

export interface ParserConstructor {
  new (buffer: ArrayBuffer): ParserInterface;
}
