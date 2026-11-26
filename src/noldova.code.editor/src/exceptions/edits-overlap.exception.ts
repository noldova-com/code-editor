/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import type { TextRange } from "../models/text/text-range.js";
import { Resources } from "../resources.js";

export class EditsOverlapException extends ArgumentException {
  public override readonly name: string = Resources.editsOverlapExceptionName;

  public readonly first: TextRange;
  public readonly second: TextRange;

  public constructor(first: TextRange, second: TextRange) {
    super(Resources.formatEditsOverlap(first.start.line, first.start.column, second.start.line, second.start.column), Resources.editsParameter);

    this.first = first;
    this.second = second;
  }
}
