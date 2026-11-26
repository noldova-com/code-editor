/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { DiffSpan, type IDiffAlgorithm } from "@noldova/code.editor";

export class NamedAlgorithm implements IDiffAlgorithm {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }

  public lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan> {
    return new List([new DiffSpan(0, original.count(), 0, modified.count())]);
  }

  public characters(): IReadOnlyList<DiffSpan> {
    return new List<DiffSpan>();
  }
}
