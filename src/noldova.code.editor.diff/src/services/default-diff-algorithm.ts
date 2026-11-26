/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiffSpan, IDiffAlgorithm } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";
import { TextDiff } from "@noldova/diff";

import { Resources } from "../resources.js";

export class DefaultDiffAlgorithm implements IDiffAlgorithm {
  public readonly id: string = Resources.defaultAlgorithmId;

  public lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan> {
    return new List<DiffSpan>(TextDiff.lines(original.toArray(), modified.toArray()));
  }

  public characters(original: string, modified: string): IReadOnlyList<DiffSpan> {
    return new List<DiffSpan>(TextDiff.characters(original, modified));
  }
}
