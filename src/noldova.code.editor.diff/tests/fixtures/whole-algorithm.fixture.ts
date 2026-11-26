/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiffSpan, type IDiffAlgorithm } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

export class WholeAlgorithm implements IDiffAlgorithm {
  public readonly id: string = "whole";
  public characterCalls: number = 0;

  public lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan> {
    return new List([new DiffSpan(0, original.count(), 0, modified.count())]);
  }

  public characters(original: string, modified: string): IReadOnlyList<DiffSpan> {
    this.characterCalls++;

    return new List([new DiffSpan(0, original.length, 0, modified.length)]);
  }
}
