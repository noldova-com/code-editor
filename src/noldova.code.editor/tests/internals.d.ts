/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/code.editor/models/text/line-chunk.js" {
  export class LineChunk {
    public length: number;
    private constructor();
    public static ofLines(texts: string[], endings: string[]): LineChunk;
    public static ofSource(source: string, starts: readonly number[], textEnds: readonly number[]): LineChunk;
    public get lineCount(): number;
    public get texts(): readonly string[];
    public get endings(): readonly string[];
    public textAt(line: number): string;
    public endingAt(line: number): string;
    public text(): string;
    public replace(start: number, deleteCount: number, texts: readonly string[], endings: readonly string[]): void;
    public offsetOf(line: number): number;
    public lineAt(offset: number): number;
  }
}

declare module "@noldova/code.editor/models/tokens/stale-state.js" {
  import type { ITokenizerState } from "@noldova/code.editor";

  export class StaleState implements ITokenizerState {
    public equals(other: ITokenizerState): boolean;
  }
}

declare module "@noldova/code.editor/services/text-search.js" {
  import type { TextDocument, TextSearch as PublicTextSearch } from "@noldova/code.editor";

  export class TextSearch extends PublicTextSearch {
    public get searchedCharacters(): number;
    public columnsIn(document: TextDocument, line: number): readonly number[];
  }
}

declare module "@noldova/code.editor/services/platforms.js" {
  export class Platforms {
    public static of(platform: string): string;
  }
}

declare module "@noldova/code.editor/resources.js" {
  export class Resources {
    public static readonly diffAlgorithmRegistry: string;
    public static readonly backgroundJobRegistry: string;
    public static readonly message: "message";
  }
}
