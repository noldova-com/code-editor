/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LineChunk } from "@noldova/code.editor/models/text/line-chunk.js";

export class ChunkWatch {
  public readonly sourceLengths: number[] = [];
  public readonly replacedLineCounts: number[] = [];

  public whileOpening<T>(work: () => T): T {
    const ofSource: typeof LineChunk.ofSource = LineChunk.ofSource;
    const lengths: number[] = this.sourceLengths;
    LineChunk.ofSource = (source: string, starts: readonly number[], textEnds: readonly number[]): LineChunk => {
      lengths.push(source.length);

      return ofSource.call(LineChunk, source, starts, textEnds);
    };
    try {
      return work();
    }
    finally {
      LineChunk.ofSource = ofSource;
    }
  }

  public whileEditing(work: () => void): void {
    const replace: LineChunk["replace"] = LineChunk.prototype.replace;
    const counts: number[] = this.replacedLineCounts;
    LineChunk.prototype.replace = function (this: LineChunk, start: number, deleteCount: number, texts: readonly string[], endings: readonly string[]): void {
      counts.push(this.lineCount);
      replace.call(this, start, deleteCount, texts, endings);
    };
    try {
      work();
    }
    finally {
      LineChunk.prototype.replace = replace;
    }
  }
}
