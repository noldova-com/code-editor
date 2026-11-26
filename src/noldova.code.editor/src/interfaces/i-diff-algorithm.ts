/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { DiffSpan } from "../models/diff-span.js";

export interface IDiffAlgorithm {
  readonly id: string;

  lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan>;

  characters(original: string, modified: string): IReadOnlyList<DiffSpan>;
}
