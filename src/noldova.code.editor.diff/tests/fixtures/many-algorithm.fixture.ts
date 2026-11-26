/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiffSpan, type IDiffAlgorithm } from "@noldova/code.editor";
import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

export class ManyAlgorithm implements IDiffAlgorithm {
  public readonly id: string = "many";

  public lines(): IReadOnlyList<DiffSpan> {
    return Enumerable.range(0, 4097).select(t => new DiffSpan(t, t + 1, t, t + 1)).toList();
  }

  public characters(): IReadOnlyList<DiffSpan> {
    return new List<DiffSpan>();
  }
}
