interface PseudoLine {
  lineNumber: number;
  original: string;
  pseudo: string;
}

interface UpdateMessage {
  type: 'update';
  pseudoLines: PseudoLine[];
  sourceLines: string[];
}

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};
