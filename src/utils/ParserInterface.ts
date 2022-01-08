export interface ParserInterface {
  parse(): this;
}

export interface ParserConstructor {
  new(buffer: ArrayBuffer): ParserInterface;
}
