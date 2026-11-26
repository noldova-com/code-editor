/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeBarAction } from "@noldova/code.editor.angular";
import type { IReadOnlyList } from "@noldova/context.collections";

export class ConflictChunk {
  public readonly line: number;
  public readonly index: number;
  public readonly length: number;
  public readonly note: string;
  public readonly actions: IReadOnlyList<CodeBarAction>;

  public constructor(line: number, index: number, length: number, note: string, actions: IReadOnlyList<CodeBarAction>) {
    this.line = line;
    this.index = index;
    this.length = length;
    this.note = note;
    this.actions = actions;
  }
}
